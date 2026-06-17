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

/** The minimal identity a (mock or real) account session carries. */
export interface AccountIdentity {
  email: string
  name: string
}

/** Factory for an authenticated session. Display name falls back to the email's
 * local part, then a neutral label, so the greeting always has something to show. */
export function makeAccountSession(
  id: string,
  identity: AccountIdentity,
  createdAt: string,
): Session {
  const fromEmail = identity.email.split('@')[0]?.trim() ?? ''
  const displayName = identity.name.trim() || fromEmail || 'You'
  return { id, kind: 'account', displayName, createdAt }
}
