// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const URL = process.env.SUPABASE_TEST_URL
const KEY = process.env.SUPABASE_TEST_KEY
const SECRET_KEY = process.env.SUPABASE_TEST_SECRET_KEY

const MIRROR_TABLES = [
  'decks',
  'cards',
  'folders',
  'questions',
  'progress',
  'preferences',
  'profiles',
  'history',
] as const

const BUCKETS = ['deck-images', 'avatars'] as const

const live = Boolean(URL && KEY && SECRET_KEY)
const run = live ? describe : describe.skip

run('purge-account', () => {
  let admin: SupabaseClient
  let client: SupabaseClient
  let userId: string
  const email = `purge-${Date.now()}@example.com`
  const password = 'purge-test-password'

  beforeAll(async () => {
    admin = createClient(URL as string, SECRET_KEY as string, {
      auth: { persistSession: false },
    })
    client = createClient(URL as string, KEY as string, { auth: { persistSession: false } })

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) throw new Error(error?.message ?? 'could not create the test user')
    userId = data.user.id

    await client.auth.signInWithPassword({ email, password })

    for (const table of MIRROR_TABLES) {
      await client.rpc('push_documents', {
        p_table: table,
        p_rows: [
          {
            id: `purge-${table}`,
            user_id: userId,
            data: { id: `purge-${table}`, updatedAt: new Date().toISOString() },
            deleted: false,
          },
        ],
      })
    }
    for (const bucket of BUCKETS) {
      await client.storage
        .from(bucket)
        .upload(`${userId}/purge-fixture`, new Blob(['x']), { upsert: true })
    }

    await admin.from('account_deletions').upsert({
      user_id: userId,
      requested_at: new Date().toISOString(),
      purge_after: new Date(Date.now() - 1000).toISOString(),
    })

    await admin.functions.invoke('purge-account', { body: {} })
  }, 120_000)

  afterAll(async () => {
    await admin?.auth.admin.deleteUser(userId).catch(() => {})
  })

  it('leaves no row in any of the eight mirror tables', async () => {
    for (const table of MIRROR_TABLES) {
      const { data, error } = await admin.from(table).select('id').eq('user_id', userId)
      expect(error, `${table}: ${error?.message}`).toBeNull()
      expect(data, `${table} still holds rows`).toEqual([])
    }
  })

  it('leaves no object in either bucket', async () => {
    for (const bucket of BUCKETS) {
      const { data, error } = await admin.storage.from(bucket).list(userId)
      expect(error, `${bucket}: ${error?.message}`).toBeNull()
      expect(data ?? [], `${bucket} still holds objects`).toEqual([])
    }
  })

  it('leaves no schedule row and no auth user', async () => {
    const { data: schedule } = await admin
      .from('account_deletions')
      .select('user_id')
      .eq('user_id', userId)
    expect(schedule).toEqual([])

    const { data: user } = await admin.auth.admin.getUserById(userId)
    expect(user?.user ?? null).toBeNull()
  })
})
