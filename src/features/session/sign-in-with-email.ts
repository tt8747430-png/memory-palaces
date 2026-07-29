import { makeAccountSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

export async function signInWithEmail(
  deps: SessionCommandDeps,
  email: string,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signIn({ email })
  await deps.sessionStore
    .getState()
    .set(makeAccountSession(auth.id, { email, name: '' }, nowIso(now)))
}
