import { makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'

export async function continueAsGuest(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.persistGuest()
  await deps.sessionStore.getState().set(makeGuestSession(auth.id, new Date(now).toISOString()))
}
