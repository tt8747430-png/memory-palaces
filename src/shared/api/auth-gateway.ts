import type { Unsubscribe } from './base-repository'

export type AuthKind = 'guest' | 'account'
export type AuthProvider = 'google' | 'apple'

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

/**
 * The identity port. Cloud sessions are restored asynchronously and can change underneath the app
 * (token refresh, OAuth return, sign-out in another tab), so reads are promises and every consumer
 * subscribes through `onAuthChange` rather than polling.
 */
export interface AuthGateway {
  signUp(input: SignUpInput): Promise<PersistedAuth>
  signIn(input: SignInInput): Promise<PersistedAuth>
  /** Redirect-based: resolves once the redirect has been started, not once signed in. */
  signInWithProvider(provider: AuthProvider): Promise<void>
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  getCurrent(): Promise<PersistedAuth | null>
  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe
}
