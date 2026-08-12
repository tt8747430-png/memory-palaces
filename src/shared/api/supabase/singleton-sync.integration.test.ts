// @vitest-environment node
/**
 * The singleton entities — profile, progress, preferences — against a real Supabase stack.
 *
 * These exist because the first version of the schema could not store them at all: their document
 * ids are the words `profile`, `progress` and `preferences`, not uuids, so every push was rejected
 * and RxDB retried forever. Nothing caught it, because the other suites only ever synced `decks`.
 *
 * Skipped unless SUPABASE_TEST_URL / SUPABASE_TEST_KEY point at a project — see
 * `replication.integration.test.ts` for the run instructions.
 */
import 'fake-indexeddb/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RxCollection, RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from '@/shared/api/rxdb/database'
import { createCollectionReplication } from './replication'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'sync@example.com'
const PASSWORD = process.env.SUPABASE_TEST_PASSWORD ?? 'sync-test-password'

/** The real ids these documents carry on the device. */
const SINGLETONS = [
  { table: 'profiles', id: 'profile' },
  { table: 'progress', id: 'progress' },
  { table: 'preferences', id: 'preferences' },
] as const

interface Singleton extends Identifiable {
  updatedAt: string
  xp: number
}

const schema: RxJsonSchema<Singleton> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    updatedAt: { type: 'string' },
    xp: { type: 'number' },
  },
  required: ['id', 'updatedAt', 'xp'],
}

async function openSingleton(collectionName: string): Promise<RxCollection<Singleton>> {
  const opened = await openRxdbCollection({
    databaseName: `mindscape-singleton-${crypto.randomUUID()}`,
    collectionName,
    schema,
    storage: getRxStorageDexie(),
  })
  return opened.collection
}

const settle = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms))
const TIMEOUT = 60_000

describe.skipIf(!URL || !KEY)('singleton entities sync', () => {
  let supabase: SupabaseClient
  let userId: string

  beforeAll(async () => {
    supabase = createClient(URL as string, KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const signIn = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
    if (signIn.error) throw new Error(signIn.error.message)
    userId = signIn.data.user?.id ?? ''
    expect(userId).not.toBe('')
  }, TIMEOUT)

  afterAll(async () => {
    for (const { table, id } of SINGLETONS) {
      if (supabase) await supabase.from(table).delete().eq('id', id).eq('user_id', userId)
    }
  }, TIMEOUT)

  it.each(SINGLETONS)(
    'pushes and pulls $table, whose id is the word "$id"',
    async ({ table, id }) => {
      const local = await openSingleton(table)
      const replication = createCollectionReplication({
        supabase,
        collection: local as unknown as RxCollection<Identifiable>,
        table,
        userId,
      })
      await replication.awaitInitialReplication()

      await local.upsert({ id, updatedAt: '2026-08-12T10:00:00Z', xp: 120 })
      await replication.awaitInSync()

      const { data, error } = await supabase
        .from(table)
        .select('id,data')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      expect(error).toBeNull()
      expect((data?.data as { xp: number } | undefined)?.xp).toBe(120)

      // A second, cold device must receive it — the row is keyed per user, not globally.
      const second = await openSingleton(table)
      const secondReplication = createCollectionReplication({
        supabase,
        collection: second as unknown as RxCollection<Identifiable>,
        table,
        userId,
      })
      await secondReplication.awaitInitialReplication()
      await settle(500)

      expect((await second.findOne(id).exec())?.xp).toBe(120)

      await Promise.all([replication.cancel(), secondReplication.cancel()])
    },
    TIMEOUT,
  )

  it(
    'refuses a stale write and hands the newer document back as a conflict',
    async () => {
      const { table, id } = SINGLETONS[1]
      const local = await openSingleton(table)
      const replication = createCollectionReplication({
        supabase,
        collection: local as unknown as RxCollection<Identifiable>,
        table,
        userId,
      })
      await replication.awaitInitialReplication()

      // The server already holds a later write than the one about to be pushed.
      await supabase.from(table).upsert([
        {
          id,
          user_id: userId,
          data: { id, updatedAt: '2026-08-12T12:00:00Z', xp: 999 },
          deleted: false,
        },
      ])

      const refused = await supabase.rpc('push_documents', {
        p_table: table,
        p_rows: [{ id, data: { id, updatedAt: '2026-08-12T09:00:00Z', xp: 1 }, deleted: false }],
      })

      expect(refused.error).toBeNull()
      expect(refused.data).toHaveLength(1)
      expect((refused.data as { data: { xp: number } }[])[0]?.data.xp).toBe(999)

      // And the server kept the newer document rather than the stale one.
      const { data } = await supabase
        .from(table)
        .select('data')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      expect((data?.data as { xp: number } | undefined)?.xp).toBe(999)

      await replication.cancel()
    },
    TIMEOUT,
  )
})
