import { makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

export async function continueAsGuest(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.persistGuest()
  await deps.sessionStore.getState().set(makeGuestSession(auth.id, nowIso(now)))
}
