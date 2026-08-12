/**
 * Two-client convergence against a real Supabase stack.
 *
 * Skipped unless a stack is pointed at:
 *   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
 *   SUPABASE_TEST_KEY=<publishable key> \
 *   SUPABASE_TEST_EMAIL=sync@example.test SUPABASE_TEST_PASSWORD=... \
 *   npx vitest run src/shared/api/supabase/replication.integration.test.ts
 *
 * `supabase start` + `supabase db reset` applies the phase-9 migrations; the test signs a real
 * user in, because every row is behind RLS and an anonymous client sees nothing.
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
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'sync@example.test'
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

describe.skipIf(!URL || !KEY)('supabase replication (two clients)', () => {
  let supabase: SupabaseClient
  let userId: string

  beforeAll(async () => {
    supabase = await client()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? ''
    expect(userId).not.toBe('')
  })

  afterAll(async () => {
    await supabase.from(TABLE).delete().eq('user_id', userId)
  })

  it('converges a write from client A to client B', async () => {
    const [a, b] = [await openCollection(), await openCollection()]
    const repA = createCollectionReplication({ supabase, collection: a, table: TABLE, userId })
    const repB = createCollectionReplication({ supabase, collection: b, table: TABLE, userId })
    await Promise.all([repA.awaitInitialReplication(), repB.awaitInitialReplication()])

    const id = crypto.randomUUID()
    await a.upsert({ id, name: 'Hello', createdAt: 't1', updatedAt: 't1' })
    await repA.awaitInSync()
    repB.reSync()
    await settle()

    const onB = await b.findOne(id).exec()
    expect(onB?.name).toBe('Hello')

    await Promise.all([repA.cancel(), repB.cancel()])
  })

  it('resolves a concurrent edit with last-write-wins and propagates the tombstone', async () => {
    const [a, b] = [await openCollection(), await openCollection()]
    const id = crypto.randomUUID()

    const repA = createCollectionReplication({ supabase, collection: a, table: TABLE, userId })
    await repA.awaitInitialReplication()
    await a.upsert({ id, name: 'from A', createdAt: 't1', updatedAt: 't1' })
    await repA.awaitInSync()

    // B starts cold, edits the same document with a newer clock, then syncs.
    await b.upsert({ id, name: 'from B', createdAt: 't1', updatedAt: 't2' })
    const repB = createCollectionReplication({ supabase, collection: b, table: TABLE, userId })
    await repB.awaitInitialReplication()
    await repB.awaitInSync()
    repA.reSync()
    await settle()

    expect((await a.findOne(id).exec())?.name).toBe('from B')

    const doc = await b.findOne(id).exec()
    await doc?.remove()
    await repB.awaitInSync()
    repA.reSync()
    await settle()

    expect(await a.findOne(id).exec()).toBeNull()

    await Promise.all([repA.cancel(), repB.cancel()])
  })
})
