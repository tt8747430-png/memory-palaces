import type { Identifiable } from '@/shared/api'

export type SessionKind = 'guest' | 'account'

export interface Session extends Identifiable {
  id: string
  kind: SessionKind
  displayName: string
  createdAt: string
}

export function makeGuestSession(id: string, createdAt: string): Session {
  return { id, kind: 'guest', displayName: 'Guest', createdAt }
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
  const fromEmail = identity.email.split('@')[0]?.trim() ?? ''
  const displayName = identity.name.trim() || fromEmail || 'You'
  return { id, kind: 'account', displayName, createdAt }
}
