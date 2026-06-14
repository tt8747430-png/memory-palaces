import type { Identifiable } from '@/shared/api'

export type SessionKind = 'guest' | 'account'

/** The current user session. Guest by default; an account claims it later (Phase 9). */
export interface Session extends Identifiable {
  id: string
  kind: SessionKind
  displayName: string
  /** ISO timestamp. Becomes server-time once sync lands. */
  createdAt: string
}

/** Factory (entities own their constructors). Pure — id + clock are injected. */
export function makeGuestSession(id: string, createdAt: string): Session {
  return { id, kind: 'guest', displayName: 'Guest', createdAt }
}
