import {
  type AuthError as SupabaseAuthError,
  isAuthRetryableFetchError,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import {
  AuthError,
  type AuthGateway,
  type OAuthProvider,
  type PersistedAuth,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
  type Unsubscribe,
} from '@/shared/api'

const GUEST_KEY = 'mindscape:guest'

const fail = (error: SupabaseAuthError): never => {
  if (isAuthRetryableFetchError(error)) throw new AuthError(error.message, 'network')
  throw new AuthError(error.message, error.code ?? 'unknown')
}

const toAuth = (user: User): PersistedAuth => ({
  id: user.id,
  kind: 'account',
  email: user.email ?? undefined,
  name: (user.user_metadata?.name as string | undefined) ?? '',
})

export class SupabaseAuthGateway implements AuthGateway {
  constructor(
    private readonly client: SupabaseClient,
    private readonly genId: () => string = () => crypto.randomUUID(),
  ) {}

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    })
    if (error) fail(error)
    if (!data.user) throw new AuthError('Sign-up failed', 'signup_failed')
    const sessionActive = Boolean(data.session)
    if (sessionActive) this.forgetGuest()
    return { auth: toAuth(data.user), sessionActive }
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })
    if (error) fail(error)
    if (!data.user) throw new AuthError('Sign-in failed', 'signin_failed')
    this.forgetGuest()
    return toAuth(data.user)
  }

  async signInWithProvider(provider: OAuthProvider): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) fail(error)
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
    if (error && !isAuthRetryableFetchError(error)) fail(error)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=recovery`,
    })
    if (error) fail(error)
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password })
    if (error) fail(error)
  }

  async completeAuthRedirect(code: string): Promise<void> {
    const { error } = await this.client.auth.exchangeCodeForSession(code)
    if (error) fail(error)
  }

  async getCurrent(): Promise<PersistedAuth | null> {
    const { data } = await this.client.auth.getSession()
    if (data.session?.user) return toAuth(data.session.user)
    return this.readGuest()
  }

  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.forgetGuest()
        cb(toAuth(session.user))
        return
      }
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
