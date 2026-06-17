import { makeAccountSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'

/**
 * Command — sign in to a (mock) account. Credentials are NOT verified; the session
 * derives its display name from the email's local part. Password stays in the form,
 * never persisted. Real verification arrives with the Supabase adapter (Phase 9).
 */
export async function signInWithEmail(
  deps: SessionCommandDeps,
  email: string,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signIn({ email })
  await deps.sessionStore
    .getState()
    .set(makeAccountSession(auth.id, { email, name: '' }, new Date(now).toISOString()))
}
