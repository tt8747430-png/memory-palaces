// Schedules the caller's account for purging, 30 days out, and signs them out everywhere.
//
// A secret key, because both halves are beyond what a client may do: `account_deletions` grants no
// insert to `authenticated`, and revoking every refresh token for a user is an admin call. The
// caller's identity comes from the bearer token they sent, never from the request body — a user id
// in a payload is a user id anyone can type. The platform does not check that token for us
// (`verify_jwt = false`, see `_shared/secret-keys.ts`); `auth.getUser` does.
//
// Nothing is destroyed here. `purge-account` does that, 30 days later, and signing back in before
// then cancels it.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { secretKey } from '../_shared/secret-keys.ts'

// Mirrors `ACCOUNT_DELETION_GRACE_DAYS` in `src/shared/config/constants.ts`, which the app states.
const GRACE_DAYS = 30

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization') ?? ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey(), {
    auth: { persistSession: false },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'unauthorized' }, 401)

  const purgeAfter = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const requestedAt = new Date().toISOString()

  const { error: upsertError } = await admin
    .from('account_deletions')
    .upsert(
      { user_id: user.id, requested_at: requestedAt, purge_after: purgeAfter },
      { onConflict: 'user_id' },
    )
  if (upsertError) return json({ error: upsertError.message }, 500)

  // Global, so a device the user no longer has cannot go on using the account during the grace.
  const { error: signOutError } = await admin.auth.admin.signOut(token, 'global')
  if (signOutError) return json({ error: signOutError.message }, 500)

  return json({ requestedAt, purgeAfter })
})
