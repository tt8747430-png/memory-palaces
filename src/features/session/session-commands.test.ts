import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createSessionStore, type Session } from '@/entities/session'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { signUpWithEmail } from './sign-up-with-email'
import { signInWithEmail } from './sign-in-with-email'
import { continueAsGuest } from './continue-as-guest'
import { signOut } from './sign-out'
import { restoreSession } from './restore-session'
import { requestPasswordReset } from './request-password-reset'

const AT = 0 // fixed clock

function setup() {
  let n = 0
  const gateway = new LocalAuthGateway(() => `id-${++n}`)
  const sessionStore = createSessionStore(new InMemoryRepository<Session>())
  return { gateway, sessionStore, deps: { gateway, sessionStore } }
}

describe('session commands', () => {
  beforeEach(() => localStorage.clear())

  it('signUpWithEmail creates an account session and persists the identity', async () => {
    const { gateway, sessionStore, deps } = setup()
    await signUpWithEmail(deps, { name: 'Ada', email: 'a@b.com' }, AT)

    expect(sessionStore.getState().session).toMatchObject({ kind: 'account', displayName: 'Ada' })
    expect(gateway.getPersisted()).toMatchObject({ kind: 'account', email: 'a@b.com', name: 'Ada' })
  })

  it('signInWithEmail derives a display name from the email', async () => {
    const { sessionStore, deps } = setup()
    await signInWithEmail(deps, 'ada@b.com', AT)
    expect(sessionStore.getState().session).toMatchObject({ kind: 'account', displayName: 'ada' })
  })

  it('continueAsGuest creates a guest session and persists the guest choice', async () => {
    const { gateway, sessionStore, deps } = setup()
    await continueAsGuest(deps, AT)
    expect(sessionStore.getState().session?.kind).toBe('guest')
    expect(gateway.getPersisted()?.kind).toBe('guest')
  })

  it('signOut clears the session and the persisted identity', async () => {
    const { gateway, sessionStore, deps } = setup()
    await signUpWithEmail(deps, { name: 'Ada', email: 'a@b.com' }, AT)
    await signOut(deps)
    expect(sessionStore.getState().session).toBeNull()
    expect(gateway.getPersisted()).toBeNull()
  })

  it('restoreSession rehydrates a persisted account', async () => {
    const { gateway, deps } = setup()
    await gateway.signUp({ name: 'Ada', email: 'a@b.com' }) // persist only, no session
    await restoreSession(deps, AT)
    expect(deps.sessionStore.getState().session).toMatchObject({
      kind: 'account',
      displayName: 'Ada',
    })
  })

  it('restoreSession is a no-op when nothing is persisted', async () => {
    const { deps } = setup()
    await restoreSession(deps, AT)
    expect(deps.sessionStore.getState().session).toBeNull()
  })

  it('requestPasswordReset resolves', async () => {
    const { gateway } = setup()
    await expect(requestPasswordReset(gateway, 'a@b.com')).resolves.toBeUndefined()
  })
})
