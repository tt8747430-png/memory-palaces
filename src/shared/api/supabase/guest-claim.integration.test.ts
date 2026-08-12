/**
 * Guest → account → second device, against a real Supabase stack.
 *
 * Skipped unless SUPABASE_TEST_URL / SUPABASE_TEST_KEY point at one — see
 * `replication.integration.test.ts` for the full run instructions.
 *
 * The claim is deliberately undramatic: the guest's documents are already on the device, so
 * "claiming" them is just starting replication under the new account id and letting the first push
 * stamp them. This test is what proves that.
 */
import 'fake-indexeddb/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RxCollection, RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from '@/shared/api/rxdb/database'
import { claimGuestData } from '@/features/auth'
import { resolveDataTransition } from '@/shared/lib'
import { SyncManager } from './sync-manager'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'claim@example.test'
const PASSWORD = process.env.SUPABASE_TEST_PASSWORD ?? 'claim-test-password'

interface SyncDeck extends Identifiable {
  name: string
  createdAt: string
  updatedAt: string
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

async function openDecks(): Promise<RxCollection<SyncDeck>> {
  const opened = await openRxdbCollection({
    databaseName: `mindscape-claim-${crypto.randomUUID()}`,
    collectionName: 'decks',
    schema: deckSchema,
    storage: getRxStorageDexie(),
  })
  return opened.collection
}

const settle = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms))

describe.skipIf(!URL || !KEY)('guest → account claim', () => {
  let supabase: SupabaseClient
  let userId: string

  beforeAll(async () => {
    supabase = createClient(URL as string, KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const signIn = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
    if (signIn.error) {
      const signUp = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD })
      if (signUp.error) throw new Error(signUp.error.message)
    }
    userId = (await supabase.auth.getUser()).data.user?.id ?? ''
    expect(userId).not.toBe('')
    await supabase.from('decks').delete().eq('user_id', userId)
  })

  afterAll(async () => {
    await supabase.from('decks').delete().eq('user_id', userId)
  })

  it('pushes a guest’s decks into a fresh account and pulls them onto a second device', async () => {
    // Device A studied as a guest.
    const deviceA = await openDecks()
    await deviceA.bulkUpsert([
      { id: crypto.randomUUID(), name: 'Guest deck 1', createdAt: 't1', updatedAt: 't1' },
      { id: crypto.randomUUID(), name: 'Guest deck 2', createdAt: 't1', updatedAt: 't1' },
    ])

    const managerA = SyncManager.fromSupabase(supabase, [
      { table: 'decks', collection: deviceA as unknown as RxCollection<Identifiable> },
    ])
    const transition = resolveDataTransition(
      { id: 'g1', kind: 'guest' },
      { id: userId, kind: 'account' },
    )
    expect(transition).toBe('preserve')

    await claimGuestData({
      transition,
      userId,
      syncManager: managerA,
      resetLocal: () => Promise.reject(new Error('a claim must never wipe the guest’s data')),
    })
    await managerA.flush()

    const { data: rows } = await supabase.from('decks').select('id,data').eq('user_id', userId)
    expect(rows).toHaveLength(2)

    // Device B signs into the same account with an empty database.
    const deviceB = await openDecks()
    const managerB = SyncManager.fromSupabase(supabase, [
      { table: 'decks', collection: deviceB as unknown as RxCollection<Identifiable> },
    ])
    await managerB.start(userId)
    await managerB.flush()
    await settle()

    const pulled = await deviceB.find().exec()
    expect(pulled.map((deck) => deck.name).sort()).toEqual(['Guest deck 1', 'Guest deck 2'])

    await Promise.all([managerA.stop(), managerB.stop()])
  })
})
