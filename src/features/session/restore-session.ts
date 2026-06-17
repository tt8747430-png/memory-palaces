import { makeAccountSession, makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'

/**
 * Command — rehydrate the in-memory session from the gateway on boot. The session
 * store is in-memory and does not survive reload, so the gateway (localStorage) is
 * the source of truth for "who is signed in". When nothing is persisted the session
 * stays null and the route guard sends the user to login.
 */
export async function restoreSession(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const persisted = deps.gateway.getPersisted()
  if (!persisted) return

  const createdAt = new Date(now).toISOString()
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
