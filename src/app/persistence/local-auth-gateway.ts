import type { AuthGateway, PersistedAuth, SignInInput, SignUpInput } from '@/shared/api'

const STORAGE_KEY = 'mindscape:auth'

/**
 * Mock auth adapter. Persists the entry choice (account or guest) to localStorage
 * with NO credential validation — sign-in/sign-up just save and succeed. It stores
 * email + name only, never a raw password (nothing checks it, so keeping it would be
 * a plaintext footgun). Phase 9 replaces this with a Supabase adapter; the port and
 * every feature stay the same.
 */
export class LocalAuthGateway implements AuthGateway {
  constructor(private readonly genId: () => string = () => crypto.randomUUID()) {}

  async signUp(input: SignUpInput): Promise<PersistedAuth> {
    return this.write({
      id: this.genId(),
      kind: 'account',
      email: input.email,
      name: input.name,
    })
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    // No verification and no account registry: sign-in simply mints an account
    // from the email. The session derives a display name from the email's local
    // part. A real registry + credential check arrives with the Supabase adapter.
    return this.write({ id: this.genId(), kind: 'account', email: input.email, name: '' })
  }

  async persistGuest(): Promise<PersistedAuth> {
    const prior = this.getPersisted()
    if (prior?.kind === 'guest') return prior
    return this.write({ id: this.genId(), kind: 'guest' })
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  async requestPasswordReset(_email: string): Promise<void> {
    // No backend: recovery is simulated entirely in the UI.
  }

  getPersisted(): PersistedAuth | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as PersistedAuth
      return parsed.id && (parsed.kind === 'guest' || parsed.kind === 'account') ? parsed : null
    } catch {
      return null
    }
  }

  private write(auth: PersistedAuth): PersistedAuth {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    return auth
  }
}
