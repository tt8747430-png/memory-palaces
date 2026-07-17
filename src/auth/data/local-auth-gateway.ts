import type { AuthGateway, PersistedAuth, SignInInput, SignUpInput } from './auth-gateway'

const STORAGE_KEY = 'mindscape:auth'

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

  requestPasswordReset(_email: string): Promise<void> {
    // Local mock gateway: no mail to send; resolve so the UI flow completes.
    return Promise.resolve()
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
