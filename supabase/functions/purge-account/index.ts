// Destroys every account whose grace period has run out. Invoked daily by the `purge-accounts`
// cron job; a secret key throughout, because none of this is a client's to do.
//
// The order is the point: **the auth user goes last, and the schedule row goes with it.**
// `account_deletions.user_id` references `auth.users on delete cascade`, so deleting the user is what
// removes the row. Deleting the row as a step of its own before the user — the order the design
// first wrote down — meant a failed `deleteUser` left an auth user with no schedule behind it, and
// nothing would ever try again. Now a failure at any step leaves the account still scheduled, and the
// next run retries it; storage is emptied first so nothing is orphaned behind a user already gone.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { secretKey, sentSecretKey } from '../_shared/secret-keys.ts'

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** How many objects one listing returns. Storage caps a page; the loop below reads until empty. */
const PAGE = 1000

/**
 * Empties `${userId}/` in one bucket. Storage has no recursive delete, so the prefix is listed and
 * removed a page at a time until a listing comes back empty — one page was a purge that left every
 * object past the thousandth behind a deleted user.
 */
async function emptyPrefix(admin: SupabaseClient, bucket: string, userId: string): Promise<void> {
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: PAGE })
    if (error) throw new Error(`${bucket}: ${error.message}`)
    const paths = (data ?? []).map((file) => `${userId}/${file.name}`)
    if (!paths.length) return
    const { error: removeError } = await admin.storage.from(bucket).remove(paths)
    if (removeError) throw new Error(`${bucket}: ${removeError.message}`)
  }
}

async function purge(admin: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of BUCKETS) await emptyPrefix(admin, bucket, userId)

  for (const table of MIRROR_TABLES) {
    // Hard delete: a tombstone is still the user's data, and this is a purge.
    const { error } = await admin.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  // Last, and it takes the `account_deletions` row with it by cascade.
  const { error: userError } = await admin.auth.admin.deleteUser(userId)
  if (userError) throw new Error(`auth: ${userError.message}`)
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  // Only the cron job may run a purge. `invoke_purge_account` sends the project's secret key from
  // Vault on `apikey`, and nothing else is accepted — the platform verifies no key for us here.
  if (!sentSecretKey(request)) return json({ error: 'forbidden' }, 403)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey(), {
    auth: { persistSession: false },
  })

  const { data, error } = await admin
    .from('account_deletions')
    .select('user_id')
    .lte('purge_after', new Date().toISOString())
  if (error) return json({ error: error.message }, 500)

  const purged: string[] = []
  const failed: { userId: string; reason: string }[] = []

  for (const row of data ?? []) {
    const userId = row.user_id as string
    try {
      await purge(admin, userId)
      purged.push(userId)
    } catch (cause) {
      // Left scheduled on purpose: the next run tries again.
      failed.push({ userId, reason: cause instanceof Error ? cause.message : String(cause) })
    }
  }

  return json({ purged: purged.length, failed })
})
