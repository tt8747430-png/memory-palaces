import type { PersistedAuth, Unsubscribe } from '@/shared/api'
import { makeAccountSession, makeGuestSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

export async function restoreSession(
  deps: SessionCommandDeps,
  now: number = Date.now(),
): Promise<Unsubscribe> {
  const apply = async (persisted: PersistedAuth | null): Promise<void> => {
    const session = deps.sessionStore.getState()
    if (!persisted) {
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
