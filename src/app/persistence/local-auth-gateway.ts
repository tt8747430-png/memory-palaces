import {
  AuthError,
  type AuthGateway,
  type AuthProvider,
  type PersistedAuth,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
  type Unsubscribe,
} from '@/shared/api'

const STORAGE_KEY = 'mindscape:auth'

/**
 * The offline identity. Credentials are never checked and never stored — it exists so the app runs
 * with no Supabase project configured (offline dev, tests). Social sign-in has nowhere to redirect,
 * so it throws rather than pretending to succeed.
 */
export class LocalAuthGateway implements AuthGateway {
  private readonly listeners = new Set<(auth: PersistedAuth | null) => void>()

  constructor(private readonly genId: () => string = () => crypto.randomUUID()) {}

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const auth = this.write({
      id: this.genId(),
      kind: 'account',
      email: input.email,
      name: input.name,
    })
    // Nothing to confirm offline, so the session is open immediately.
    return { auth, sessionActive: true }
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    return this.write({ id: this.genId(), kind: 'account', email: input.email, name: '' })
  }

  async signInWithProvider(_provider: AuthProvider): Promise<void> {
    throw new AuthError('Social sign-in requires a cloud connection', 'offline_only')
  }

  async persistGuest(): Promise<PersistedAuth> {
    const prior = this.read()
    if (prior?.kind === 'guest') return prior
    return this.write({ id: this.genId(), kind: 'guest' })
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
    this.emit(null)
  }

  async requestPasswordReset(_email: string): Promise<void> {}

  async updatePassword(_password: string): Promise<void> {}

  async completeAuthRedirect(_code: string): Promise<void> {
    throw new AuthError('There is no cloud session to complete', 'offline_only')
  }

  async getCurrent(): Promise<PersistedAuth | null> {
    return this.read()
  }

  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  private read(): PersistedAuth | null {
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
    this.emit(auth)
    return auth
  }

  private emit(auth: PersistedAuth | null): void {
    for (const cb of this.listeners) cb(auth)
  }
}
