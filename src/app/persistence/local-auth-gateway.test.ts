import { beforeEach, describe, expect, it } from 'vitest'
import { LocalAuthGateway } from './local-auth-gateway'

function gateway() {
  let n = 0
  return new LocalAuthGateway(() => `id-${++n}`)
}

describe('LocalAuthGateway (mock auth)', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no persisted identity', async () => {
    await expect(gateway().getCurrent()).resolves.toBeNull()
  })

  it('signUp persists an account with email + name (no password)', async () => {
    const gw = gateway()
    const auth = await gw.signUp({ email: 'a@b.com', name: 'Ada', password: 'sup3rSecret!' })

    expect(auth).toEqual({ id: 'id-1', kind: 'account', email: 'a@b.com', name: 'Ada' })
    await expect(gw.getCurrent()).resolves.toEqual(auth)
    expect(JSON.stringify(localStorage.getItem('mindscape:auth'))).not.toContain('sup3rSecret')
  })

  it('signIn does not validate credentials', async () => {
    const auth = await gateway().signIn({ email: 'whoever@nowhere.com', password: 'anything' })
    expect(auth.kind).toBe('account')
    expect(auth.email).toBe('whoever@nowhere.com')
  })

  it('signIn after signOut mints a fresh account (no registry)', async () => {
    const gw = gateway()
    await gw.signUp({ email: 'a@b.com', name: 'Ada', password: 'pw' })
    await gw.signOut()
    const back = await gw.signIn({ email: 'a@b.com', password: 'pw' })
    expect(back).toEqual({ id: 'id-2', kind: 'account', email: 'a@b.com', name: '' })
  })

  it('persistGuest is idempotent', async () => {
    const gw = gateway()
    const first = await gw.persistGuest()
    const second = await gw.persistGuest()
    expect(first.kind).toBe('guest')
    expect(second).toEqual(first)
  })

  it('signOut clears the persisted identity', async () => {
    const gw = gateway()
    await gw.signUp({ email: 'a@b.com', name: 'Ada', password: 'pw' })
    await gw.signOut()
    await expect(gw.getCurrent()).resolves.toBeNull()
  })

  it('ignores corrupt storage', async () => {
    localStorage.setItem('mindscape:auth', '{not json')
    await expect(gateway().getCurrent()).resolves.toBeNull()
  })

  it('requestPasswordReset resolves without throwing', async () => {
    await expect(gateway().requestPasswordReset('a@b.com')).resolves.toBeUndefined()
  })

  it('notifies subscribers on sign-in and sign-out', async () => {
    const gw = gateway()
    const seen: (string | null)[] = []
    gw.onAuthChange((auth) => seen.push(auth?.kind ?? null))
    await gw.persistGuest()
    await gw.signOut()
    expect(seen).toEqual(['guest', null])
  })

  it('stops notifying after unsubscribe', async () => {
    const gw = gateway()
    const seen: (string | null)[] = []
    const unsubscribe = gw.onAuthChange((auth) => seen.push(auth?.kind ?? null))
    unsubscribe()
    await gw.persistGuest()
    expect(seen).toEqual([])
  })

  it('rejects social sign-in when there is no cloud to redirect to', async () => {
    await expect(gateway().signInWithProvider('google')).rejects.toThrow()
  })
})
