// @vitest-environment node
import 'fake-indexeddb/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RxCollection, RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from '@/shared/api/rxdb/database'
import { applyDataTransition } from '@/features/session'
import { resolveDataTransition } from '@/shared/lib'
import { SyncManager } from './sync-manager'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'claim@example.com'
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

const TIMEOUT = 60_000

describe.skipIf(!URL || !KEY)('guest → account claim', () => {
  let supabase: SupabaseClient
  let userId: string
  const guestDeckIds: string[] = [crypto.randomUUID(), crypto.randomUUID()]

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
  }, TIMEOUT)

  afterAll(async () => {
    if (supabase) await supabase.from('decks').delete().in('id', guestDeckIds)
  }, TIMEOUT)

  it(
    'pushes a guest’s decks into a fresh account and pulls them onto a second device',
    async () => {
      const deviceA = await openDecks()
      await deviceA.bulkUpsert(
        guestDeckIds.map((id, i) => ({
          id,
          name: `Guest deck ${i + 1}`,
          createdAt: 't1',
          updatedAt: 't1',
        })),
      )

      const managerA = SyncManager.fromSupabase(supabase, [
        { table: 'decks', collection: deviceA as unknown as RxCollection<Identifiable> },
      ])
      const transition = resolveDataTransition(null, userId)
      expect(transition).toBe('keep')

      await applyDataTransition({
        transition,
        userId,
        syncManager: managerA,
        dataOwner: { read: () => null, claim: () => {} },
        resetLocal: () => Promise.reject(new Error('a claim must never wipe the guest’s data')),
      })
      await managerA.runCycle()

      const { data: rows } = await supabase.from('decks').select('id,data').in('id', guestDeckIds)
      expect(rows).toHaveLength(2)

      const deviceB = await openDecks()
      const managerB = SyncManager.fromSupabase(supabase, [
        { table: 'decks', collection: deviceB as unknown as RxCollection<Identifiable> },
      ])
      await managerB.start(userId)
      await managerB.runCycle()
      await settle()

      const pulled = await deviceB.find().exec()
      const claimed = pulled.filter((deck) => guestDeckIds.includes(deck.id))
      expect(claimed.map((deck) => deck.name).sort()).toEqual(['Guest deck 1', 'Guest deck 2'])

      await Promise.all([managerA.stop(), managerB.stop()])
    },
    TIMEOUT,
  )
})
