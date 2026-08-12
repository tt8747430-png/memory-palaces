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
    if (!persisted) {
      if (deps.sessionStore.getState().session) await deps.sessionStore.getState().clear()
      return
    }
    const createdAt = nowIso(now)
    const session =
      persisted.kind === 'account'
        ? makeAccountSession(
            persisted.id,
            { email: persisted.email ?? '', name: persisted.name ?? '' },
            createdAt,
          )
        : makeGuestSession(persisted.id, createdAt)
    await deps.sessionStore.getState().set(session)
  }

  await apply(await deps.gateway.getCurrent())
  return deps.gateway.onAuthChange((auth) => void apply(auth))
}
