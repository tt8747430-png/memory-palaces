import type { Unsubscribe } from './base-repository'

export type AuthKind = 'guest' | 'account'
export type OAuthProvider = 'google' | 'apple'

export interface PersistedAuth {
  id: string
  kind: AuthKind
  email?: string
  name?: string
}

export interface SignUpInput {
  email: string
  name: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpResult {
  auth: PersistedAuth
  sessionActive: boolean
}

export interface AuthGateway {
  signUp(input: SignUpInput): Promise<SignUpResult>
  signIn(input: SignInInput): Promise<PersistedAuth>
  signInWithProvider(provider: OAuthProvider): Promise<void>
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  completeAuthRedirect(code: string): Promise<void>
  getCurrent(): Promise<PersistedAuth | null>
  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe
}
