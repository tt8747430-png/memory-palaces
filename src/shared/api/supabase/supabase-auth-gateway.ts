import type { SupabaseClient, User } from '@supabase/supabase-js'
import type {
  AuthGateway,
  AuthProvider,
  PersistedAuth,
  SignInInput,
  SignUpInput,
  Unsubscribe,
} from '@/shared/api'

const GUEST_KEY = 'mindscape:guest'

const toAuth = (user: User): PersistedAuth => ({
  id: user.id,
  kind: 'account',
  email: user.email ?? undefined,
  // Apple's web flow returns no name — profile onboarding fills it in rather than blocking.
  name: (user.user_metadata?.name as string | undefined) ?? '',
})

export class SupabaseAuthGateway implements AuthGateway {
  constructor(
    private readonly client: SupabaseClient,
    private readonly genId: () => string = () => crypto.randomUUID(),
  ) {}

  async signUp(input: SignUpInput): Promise<PersistedAuth> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    })
    if (error) throw new Error(error.message)
    // With email confirmation on, `session` is null until confirmed; the user still exists.
    if (!data.user) throw new Error('Sign-up failed')
    this.forgetGuest()
    return toAuth(data.user)
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-in failed')
    this.forgetGuest()
    return toAuth(data.user)
  }

  async signInWithProvider(provider: AuthProvider): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw new Error(error.message)
  }

  async persistGuest(): Promise<PersistedAuth> {
    const stored = this.readGuest()
    if (stored) return stored
    const guest: PersistedAuth = { id: this.genId(), kind: 'guest' }
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest))
    return guest
  }

  async signOut(): Promise<void> {
    this.forgetGuest()
    const { error } = await this.client.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) throw new Error(error.message)
  }

  async getCurrent(): Promise<PersistedAuth | null> {
    const { data } = await this.client.auth.getSession()
    if (data.session?.user) return toAuth(data.session.user)
    return this.readGuest()
  }

  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // A cloud identity supersedes the guest — keeping both would resurrect the guest on the
        // next sign-out and re-claim data that already belongs to an account.
        this.forgetGuest()
        cb(toAuth(session.user))
        return
      }
      // No cloud session is not the same as no identity: a guest never had one.
      cb(this.readGuest())
    })
    return () => data.subscription.unsubscribe()
  }

  private readGuest(): PersistedAuth | null {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as PersistedAuth
      return parsed.id && parsed.kind === 'guest' ? parsed : null
    } catch {
      return null
    }
  }

  private forgetGuest(): void {
    localStorage.removeItem(GUEST_KEY)
  }
}
