/** How the user entered: a throwaway guest, or a (mock) account. */
export type AuthKind = 'guest' | 'account'

/**
 * The persisted "who is signed in" record. It carries a stable `id` so the
 * in-memory session can be rebuilt with the same identity across reloads. Shape
 * mirrors what Phase 9's Supabase session will expose (kind + minimal profile),
 * so swapping the adapter never touches features.
 */
export interface PersistedAuth {
  id: string
  kind: AuthKind
  /** Present for accounts; absent for guests. */
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

/**
 * Port for authentication AND the persisted entry choice. The mock adapter
 * (`LocalAuthGateway`) writes to localStorage with NO credential validation;
 * Phase 9 swaps in a Supabase adapter without changing a single feature. It owns
 * persistence because the session store is in-memory and does not survive reload —
 * the gateway is the source of truth the boot path (`restoreSession`) reads.
 */
export interface AuthGateway {
  /** Create + persist an account identity. The mock performs no validation. */
  signUp(input: SignUpInput): Promise<PersistedAuth>
  /** Sign in to an account. The mock does not verify credentials. */
  signIn(input: SignInInput): Promise<PersistedAuth>
  /** Persist the guest choice so a returning guest skips the auth screen. */
  persistGuest(): Promise<PersistedAuth>
  /** Clear the persisted identity (logout). */
  signOut(): Promise<void>
  /** Simulated password recovery — resolves without sending anything. */
  requestPasswordReset(email: string): Promise<void>
  /** The persisted identity, or null when the user has made no entry choice yet. */
  getPersisted(): PersistedAuth | null
}
