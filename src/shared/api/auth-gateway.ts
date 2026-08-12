import type { Unsubscribe } from './base-repository'

export type AuthKind = 'guest' | 'account'
/** Named for the flow, not the React provider of the same word. */
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

/**
 * A sign-up does not always sign you in. With email confirmation on, the account exists but no
 * session does, and treating that as "signed in" would start replication with no token.
 */
export interface SignUpResult {
  auth: PersistedAuth
  sessionActive: boolean
}

/**
 * The identity port. Cloud sessions are restored asynchronously and can change underneath the app
 * (token refresh, OAuth return, sign-out in another tab), so reads are promises and every consumer
 * subscribes through `onAuthChange` rather than polling.
 */
export interface AuthGateway {
  signUp(input: SignUpInput): Promise<SignUpResult>
  signIn(input: SignInInput): Promise<PersistedAuth>
  /** Redirect-based: resolves once the redirect has been started, not once signed in. */
  signInWithProvider(provider: OAuthProvider): Promise<void>
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  /** Sets a new password for the signed-in user (also how a recovery link finishes). */
  updatePassword(password: string): Promise<void>
  /** Trades the code on an OAuth/recovery return URL for a session. */
  completeAuthRedirect(code: string): Promise<void>
  getCurrent(): Promise<PersistedAuth | null>
  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe
}
