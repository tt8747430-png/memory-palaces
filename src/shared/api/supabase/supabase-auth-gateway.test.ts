import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SupabaseAuthGateway } from './supabase-auth-gateway'

type Handler = (event: string, session: { user: unknown } | null) => void

const user = { id: 'u1', email: 'a@b.co', user_metadata: { name: 'Ada' } }

function makeClient() {
  let handler: Handler = () => {}
  const unsubscribe = vi.fn()
  return {
    emit: (session: { user: unknown } | null) => handler('SIGNED_IN', session),
    unsubscribe,
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user, session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://x' }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn((cb: Handler) => {
        handler = cb
        return { data: { subscription: { unsubscribe } } }
      }),
    },
  }
}

const gatewayFor = (client: ReturnType<typeof makeClient>) =>
  new SupabaseAuthGateway(client as never, () => 'guest-1')

describe('SupabaseAuthGateway', () => {
  beforeEach(() => localStorage.clear())

  it('maps a signed-in user to PersistedAuth', async () => {
    const client = makeClient()
    const auth = await gatewayFor(client).signIn({ email: 'a@b.co', password: 'pw' })

    expect(auth).toEqual({ id: 'u1', kind: 'account', email: 'a@b.co', name: 'Ada' })
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'pw',
    })
  })

  it('sends the display name as user metadata on sign-up', async () => {
    const client = makeClient()
    await gatewayFor(client).signUp({ email: 'a@b.co', name: 'Ada', password: 'pw' })

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'pw',
      options: { data: { name: 'Ada' } },
    })
  })

  it('starts the provider redirect with the callback URL', async () => {
    const client = makeClient()
    await gatewayFor(client).signInWithProvider('apple')

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  })

  it('throws the supabase error message on failed sign-in', async () => {
    const client = makeClient()
    client.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'bad creds' },
    })

    await expect(gatewayFor(client).signIn({ email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'bad creds',
    )
  })

  it('falls back to the stored guest when there is no cloud session', async () => {
    const client = makeClient()
    const gateway = gatewayFor(client)
    await gateway.persistGuest()

    await expect(gateway.getCurrent()).resolves.toEqual({ id: 'guest-1', kind: 'guest' })
  })

  it('prefers the cloud session over the stored guest', async () => {
    const client = makeClient()
    client.auth.getSession.mockResolvedValue({ data: { session: { user } } })
    const gateway = gatewayFor(client)
    await gateway.persistGuest()

    await expect(gateway.getCurrent()).resolves.toMatchObject({ id: 'u1', kind: 'account' })
  })

  it('keeps a guest signed in when supabase reports no session', () => {
    const client = makeClient()
    const gateway = gatewayFor(client)
    void gateway.persistGuest()
    const seen: (string | undefined)[] = []
    gateway.onAuthChange((auth) => seen.push(auth?.kind))

    client.emit(null)

    expect(seen).toEqual(['guest'])
  })

  it('drops the stored guest once a real account signs in', () => {
    const client = makeClient()
    const gateway = gatewayFor(client)
    void gateway.persistGuest()
    const seen: (string | undefined)[] = []
    gateway.onAuthChange((auth) => seen.push(auth?.kind))

    client.emit({ user })

    expect(seen).toEqual(['account'])
    expect(localStorage.getItem('mindscape:guest')).toBeNull()
  })

  it('unsubscribes from the supabase listener', () => {
    const client = makeClient()
    gatewayFor(client).onAuthChange(() => {})()
    expect(client.unsubscribe).toHaveBeenCalled()
  })
})
