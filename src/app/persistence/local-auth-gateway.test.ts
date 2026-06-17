import { beforeEach, describe, expect, it } from 'vitest'
import { LocalAuthGateway } from './local-auth-gateway'

function gateway() {
  let n = 0
  return new LocalAuthGateway(() => `id-${++n}`)
}

describe('LocalAuthGateway (mock auth)', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no persisted identity', () => {
    expect(gateway().getPersisted()).toBeNull()
  })

  it('signUp persists an account with email + name (no password)', async () => {
    const gw = gateway()
    const auth = await gw.signUp({ email: 'a@b.com', name: 'Ada' })

    expect(auth).toEqual({ id: 'id-1', kind: 'account', email: 'a@b.com', name: 'Ada' })
    expect(gw.getPersisted()).toEqual(auth)
    expect(JSON.stringify(localStorage.getItem('mindscape:auth'))).not.toContain('password')
  })

  it('signIn does not validate credentials', async () => {
    const auth = await gateway().signIn({ email: 'whoever@nowhere.com' })
    expect(auth.kind).toBe('account')
    expect(auth.email).toBe('whoever@nowhere.com')
  })

  it('signIn after signOut mints a fresh account (no registry)', async () => {
    const gw = gateway()
    await gw.signUp({ email: 'a@b.com', name: 'Ada' })
    await gw.signOut()
    const back = await gw.signIn({ email: 'a@b.com' })
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
    await gw.signUp({ email: 'a@b.com', name: 'Ada' })
    await gw.signOut()
    expect(gw.getPersisted()).toBeNull()
  })

  it('ignores corrupt storage', () => {
    localStorage.setItem('mindscape:auth', '{not json')
    expect(gateway().getPersisted()).toBeNull()
  })

  it('requestPasswordReset resolves without throwing', async () => {
    await expect(gateway().requestPasswordReset('a@b.com')).resolves.toBeUndefined()
  })
})
