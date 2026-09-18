import type { Identifiable } from '@/shared/api'

export type SessionKind = 'guest' | 'account'

export interface Session extends Identifiable {
  id: string
  kind: SessionKind
  displayName: string
  /** The address the account signs in with; null for a guest, who has none. */
  email: string | null
  createdAt: string
}

export function makeGuestSession(id: string, createdAt: string): Session {
  return { id, kind: 'guest', displayName: 'Guest', email: null, createdAt }
}

export interface AccountIdentity {
  email: string
  name: string
}

export function makeAccountSession(
  id: string,
  identity: AccountIdentity,
  createdAt: string,
): Session {
  const email = identity.email.trim()
  const fromEmail = email.split('@')[0]?.trim() ?? ''
  const displayName = identity.name.trim() || fromEmail || 'You'
  return { id, kind: 'account', displayName, email: email || null, createdAt }
}
