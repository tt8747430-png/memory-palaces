export type AuthKind = 'guest' | 'account'

export interface PersistedAuth {
  id: string
  kind: AuthKind
  email?: string
  name?: string
}

export interface SignUpInput {
  email: string
  name: string
}

export interface SignInInput {
  email: string
}

export interface AuthGateway {
  signUp(input: SignUpInput): Promise<PersistedAuth>
  signIn(input: SignInInput): Promise<PersistedAuth>
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  getPersisted(): PersistedAuth | null
}
