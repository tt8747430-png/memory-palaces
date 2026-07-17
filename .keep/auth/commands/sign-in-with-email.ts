import { makeAccountSession } from '../model/session'
import type { SessionCommandDeps } from './sign-up-with-email'

export async function signInWithEmail(
  deps: SessionCommandDeps,
  email: string,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signIn({ email })
  await deps.sessionStore.set(
    makeAccountSession(auth.id, { email, name: '' }, new Date(now).toISOString()),
  )
}
