import { makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'

/**
 * Command — enter as a guest. Persists the guest choice through the gateway (so a
 * returning guest skips the auth screen) and sets the current session. Idempotent:
 * the gateway keeps an existing guest. This is the single write-path for guest entry.
 */
export async function continueAsGuest(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.persistGuest()
  await deps.sessionStore.getState().set(makeGuestSession(auth.id, new Date(now).toISOString()))
}
