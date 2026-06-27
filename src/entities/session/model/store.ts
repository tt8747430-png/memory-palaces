import { createStore, type StoreApi } from 'zustand/vanilla'
import type { SessionRepository } from '@/entities/session'
import type { Session } from './types'

export type SessionStatus = 'idle' | 'loading' | 'ready'

export interface SessionState {
  session: Session | null
  status: SessionStatus
  /** Hydrate the current session from the repository. */
  load: () => Promise<void>
  /** Persist + set the current session. */
  set: (session: Session) => Promise<void>
  /** Remove + clear the current session. */
  clear: () => Promise<void>
}

export type SessionStore = StoreApi<SessionState>

/**
 * Store FACTORY (not a module singleton) so the repository is INJECTED. The
 * composition root builds the app's store with the real adapter; tests build one
 * with a stub — Dependency Inversion, and what the DI-swap test exercises.
 */
export function createSessionStore(repo: SessionRepository): SessionStore {
  return createStore<SessionState>((set, get) => ({
    session: null,
    status: 'idle',

    async load() {
      set({ status: 'loading' })
      const all = await repo.getAll()
      set({ session: all[0] ?? null, status: 'ready' })
    },

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
