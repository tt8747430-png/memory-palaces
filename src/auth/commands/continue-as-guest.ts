import { makeGuestSession } from '../model/session'
import type { SessionCommandDeps } from './sign-up-with-email'

export async function continueAsGuest(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.persistGuest()
  await deps.sessionStore.set(makeGuestSession(auth.id, new Date(now).toISOString()))
}
