// @vitest-environment node
import 'fake-indexeddb/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RxCollection, RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from '@/shared/api/rxdb/database'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { SyncManager } from './sync-manager'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const EMAIL = process.env.SUPABASE_TEST_EMAIL ?? 'sync@example.com'
const PASSWORD = process.env.SUPABASE_TEST_PASSWORD ?? 'sync-test-password'

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

  async function syncOnce(table: SyncedTable, collection: RxCollection<Singleton>) {
    const manager = SyncManager.fromSupabase(
      supabase,
      [{ table, collection: collection as unknown as RxCollection<Identifiable> }],
      [table],
    )
    await manager.start(userId)
    await manager.runCycle()
    await manager.stop()
  }

  it.each(SINGLETONS)(
    'pushes and pulls $table, whose id is the word "$id"',
    async ({ table, id }) => {
      const local = await openSingleton(table)
      await local.upsert({ id, updatedAt: '2026-08-12T10:00:00Z', xp: 120 })
      await syncOnce(table, local)

      const { data, error } = await supabase
        .from(table)
        .select('id,data')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      expect(error).toBeNull()
      expect((data?.data as { xp: number } | undefined)?.xp).toBe(120)

      const second = await openSingleton(table)
      await syncOnce(table, second)

      expect((await second.findOne(id).exec())?.xp).toBe(120)
    },
    TIMEOUT,
  )

  it(
    'refuses a stale write and hands the newer document back as a conflict',
    async () => {
      const { table, id } = SINGLETONS[1]
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

      const { data } = await supabase
        .from(table)
        .select('data')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      expect((data?.data as { xp: number } | undefined)?.xp).toBe(999)
    },
    TIMEOUT,
  )
})
