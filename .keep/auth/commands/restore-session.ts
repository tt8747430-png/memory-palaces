import { makeAccountSession, makeGuestSession } from '../model/session'
import type { SessionCommandDeps } from './sign-up-with-email'

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

  await deps.sessionStore.set(session)
}
