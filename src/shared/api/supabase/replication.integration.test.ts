// @vitest-environment node
import 'fake-indexeddb/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RxCollection, RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Identifiable, RemoteChangeEvent } from '@/shared/api'
import { openRxdbCollection } from '@/shared/api/rxdb/database'
import { SyncManager } from './sync-manager'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'sync@example.com'
const PASSWORD = process.env.SUPABASE_TEST_PASSWORD ?? 'sync-test-password'
const TABLE = 'decks'

interface SyncDeck extends Identifiable {
  name: string
  updatedAt: string
  createdAt: string
}

const deckSchema: RxJsonSchema<SyncDeck> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'name', 'createdAt', 'updatedAt'],
}

async function client(): Promise<SupabaseClient> {
  const supabase = createClient(URL as string, KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signIn = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (signIn.error) {
    const signUp = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD })
    if (signUp.error) throw new Error(signUp.error.message)
  }
  return supabase
}

async function openCollection(): Promise<RxCollection<SyncDeck>> {
  const opened = await openRxdbCollection({
    databaseName: `mindscape-sync-${crypto.randomUUID()}`,
    collectionName: 'decks',
    schema: deckSchema,
    storage: getRxStorageDexie(),
  })
  return opened.collection
}

const settle = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms))

async function until<T>(read: () => Promise<T | null>, budgetMs = 20_000): Promise<T | null> {
  const deadline = Date.now() + budgetMs
  for (;;) {
    const value = await read()
    if (value || Date.now() > deadline) return value
    await settle(250)
  }
}

const TIMEOUT = 60_000

describe.skipIf(!URL || !KEY)('supabase replication (two clients)', () => {
  let supabase: SupabaseClient
  let userId: string
  const created: string[] = []

  const newDeckId = () => {
    const id = crypto.randomUUID()
    created.push(id)
    return id
  }

  beforeAll(async () => {
    supabase = await client()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? ''
    expect(userId).not.toBe('')
  }, TIMEOUT)

  afterAll(async () => {
    if (supabase && created.length) await supabase.from(TABLE).delete().in('id', created)
  }, TIMEOUT)

  async function device(onChange?: (event: RemoteChangeEvent) => void) {
    const collection = await openCollection()
    const manager = SyncManager.fromSupabase(supabase, [
      { table: TABLE, collection: collection as unknown as RxCollection<Identifiable> },
    ])
    await manager.start(userId, [TABLE], onChange ? { onChange, onReconnect: () => {} } : undefined)
    return { collection, manager }
  }

  it(
    'converges a write from client A to client B across one cycle each',
    async () => {
      const [a, b] = [await device(), await device()]

      const id = newDeckId()
      await a.collection.upsert({ id, name: 'Hello', createdAt: 't1', updatedAt: 't1' })
      await a.manager.runCycle()
      await b.manager.runCycle()

      expect((await b.collection.findOne(id).exec())?.name).toBe('Hello')

      await Promise.all([a.manager.stop(), b.manager.stop()])
    },
    TIMEOUT,
  )

  it(
    'tells the other client the cloud moved, and applies nothing until it syncs',
    async () => {
      const seen: RemoteChangeEvent[] = []
      const a = await device()
      const b = await device((event) => seen.push(event))
      await settle()

      const id = newDeckId()
      await a.collection.upsert({ id, name: 'Watched', createdAt: 't1', updatedAt: 't1' })
      await a.manager.runCycle()

      const event = await until(async () => seen.find((candidate) => candidate.id === id) ?? null)
      expect(event?.table).toBe(TABLE)
      expect(await b.collection.findOne(id).exec()).toBeNull()

      await Promise.all([a.manager.stop(), b.manager.stop()])
    },
    TIMEOUT,
  )

  it(
    'reports which rows a cycle pushed',
    async () => {
      const a = await device()
      const id = newDeckId()
      await a.collection.upsert({ id, name: 'Pushed', createdAt: 't1', updatedAt: 't1' })

      const pushed = await a.manager.runCycle()

      expect(pushed[TABLE]).toContain(id)
      await a.manager.stop()
    },
    TIMEOUT,
  )

  it(
    'resolves a concurrent edit with last-write-wins and propagates the tombstone',
    async () => {
      const a = await device()
      const id = newDeckId()
      await a.collection.upsert({ id, name: 'from A', createdAt: 't1', updatedAt: 't1' })
      await a.manager.runCycle()

      const b = await device()
      await b.collection.upsert({ id, name: 'from B', createdAt: 't1', updatedAt: 't2' })
      await b.manager.runCycle()
      await a.manager.runCycle()

      expect((await a.collection.findOne(id).exec())?.name).toBe('from B')

      await (await b.collection.findOne(id).exec())?.remove()
      await b.manager.runCycle()
      await a.manager.runCycle()

      expect(await a.collection.findOne(id).exec()).toBeNull()

      await Promise.all([a.manager.stop(), b.manager.stop()])
    },
    TIMEOUT,
  )

  describe('push_documents with a base', () => {
    interface Push {
      deleted?: boolean
      base?: string | null
      baseDeleted?: boolean
    }
    const push = async (
      id: string,
      updatedAt: string,
      name: string,
      { deleted = false, base, baseDeleted }: Push = {},
    ) => {
      const { data, error } = await supabase.rpc('push_documents', {
        p_table: TABLE,
        p_rows: [
          {
            id,
            user_id: userId,
            data: { id, name, createdAt: 't1', updatedAt },
            deleted,
            ...(base === undefined ? {} : { base }),
            ...(baseDeleted === undefined ? {} : { base_deleted: baseDeleted }),
          },
        ],
      })
      if (error) throw new Error(error.message)
      return data as { id: string; data: { name: string }; deleted: boolean }[]
    }

    it(
      'applies a write over the copy it was based on, and refuses one over a copy it never saw',
      async () => {
        const id = newDeckId()
        expect(await push(id, 't1', 'first', { base: null })).toEqual([])
        expect(await push(id, 't2', 'edited elsewhere', { base: 't1' })).toEqual([])

        // Based on t1, but the server moved to t2: refused, and the t2 copy comes back to merge.
        const refused = await push(id, 't3', 'stale', { base: 't1' })
        expect(refused.map((row) => row.data.name)).toEqual(['edited elsewhere'])

        // Based on t2: applies, whatever its clock.
        expect(await push(id, 't3', 'merged', { base: 't2' })).toEqual([])
      },
      TIMEOUT,
    )

    it(
      'applies a re-push of exactly what the server holds, whatever it was based on',
      async () => {
        const id = newDeckId()
        await push(id, 't1', 'same', { base: null })
        expect(await push(id, 't1', 'same', { base: 'never' })).toEqual([])
      },
      TIMEOUT,
    )

    it(
      'refuses an edit based on the live copy once another device has deleted it',
      async () => {
        const id = newDeckId()
        await push(id, 't1', 'live', { base: null, baseDeleted: false })
        // The deletion keeps the clock: only `base_deleted` tells the two copies apart.
        await push(id, 't1', 'live', { deleted: true, base: 't1', baseDeleted: false })

        const refused = await push(id, 't2', 'edited', { base: 't1', baseDeleted: false })
        expect(refused.map((row) => row.deleted)).toEqual([true])

        // Based on the deletion it saw: a deliberate re-creation, and it applies.
        expect(await push(id, 't3', 'again', { base: 't1', baseDeleted: true })).toEqual([])
      },
      TIMEOUT,
    )

    it(
      'lets exactly one of two concurrent first pushes land, and hands the other what it wrote',
      async () => {
        const id = newDeckId()
        const [first, second] = await Promise.all([
          push(id, 't1', 'from A', { base: null, baseDeleted: false }),
          push(id, 't1', 'from B', { base: null, baseDeleted: false }),
        ])
        const { data } = await supabase.from(TABLE).select('data').eq('id', id).single()
        const held = (data as { data: { name: string } }).data.name

        expect([first, second].filter((refused) => refused.length === 0)).toHaveLength(1)
        expect([...first, ...second].map((row) => row.data.name)).toEqual([held])
      },
      TIMEOUT,
    )

    it(
      'keeps the clock rule for a row with no base — a build shipped before bases',
      async () => {
        const id = newDeckId()
        await push(id, 't2', 'newer', { base: null })
        expect((await push(id, 't1', 'older')).map((row) => row.data.name)).toEqual(['newer'])
        expect(await push(id, 't3', 'newest')).toEqual([])
      },
      TIMEOUT,
    )
  })
})
