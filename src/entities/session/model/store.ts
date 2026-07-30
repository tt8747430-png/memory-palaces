import { createStore, type StoreApi } from 'zustand/vanilla'
import type { StoreStatus } from '@/shared/lib'
import type { SessionRepository } from '@/entities/session'
import type { Session } from './types'

/**
 * The one store that does not mirror its repository. Nothing observes the
 * signed-in session — `AuthProvider` writes it once the gateway answers, and
 * every later change comes from a session command — so it holds the same
 * `status` vocabulary as the mirroring stores while owning its own writes.
 */
export interface SessionState {
  session: Session | null
  status: StoreStatus
  set: (session: Session) => Promise<void>
  clear: () => Promise<void>
}

export type SessionStore = StoreApi<SessionState>

export function createSessionStore(repo: SessionRepository): SessionStore {
  return createStore<SessionState>((set, get) => ({
    session: null,
    status: 'idle',

    async set(session) {
      const saved = await repo.save(session)
      set({ session: saved, status: 'ready' })
    },

    async clear() {
      const current = get().session
      if (current) await repo.remove(current.id)
      set({ session: null, status: 'ready' })
    },
  }))
}
