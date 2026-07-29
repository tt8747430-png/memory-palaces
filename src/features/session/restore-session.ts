import { makeAccountSession, makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

export async function restoreSession(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<void> {
  const persisted = deps.gateway.getPersisted()
  if (!persisted) return

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
