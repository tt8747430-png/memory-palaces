import type { PersistedAuth, Unsubscribe } from '@/shared/api'
import { makeAccountSession, makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

/**
 * Mirrors the gateway's identity into the session store — once for whatever is already stored, then
 * for every later change (token refresh, OAuth return, sign-out in another tab). Returns the
 * unsubscribe so the caller owns the subscription's lifetime.
 */
export async function restoreSession(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<Unsubscribe> {
  const apply = async (persisted: PersistedAuth | null): Promise<void> => {
    const session = deps.sessionStore.getState()
    if (!persisted) {
      // Cleared even when already empty: it marks the store ready, which is how the route guard
      // knows it can stop asking the gateway on every navigation.
      await session.clear()
      return
    }
    const createdAt = nowIso(now)
    const next =
      persisted.kind === 'account'
        ? makeAccountSession(
            persisted.id,
            { email: persisted.email ?? '', name: persisted.name ?? '' },
            createdAt,
          )
        : makeGuestSession(persisted.id, createdAt)
    await session.set(next)
  }

  await apply(await deps.gateway.getCurrent())
  return deps.gateway.onAuthChange((auth) => void apply(auth))
}
