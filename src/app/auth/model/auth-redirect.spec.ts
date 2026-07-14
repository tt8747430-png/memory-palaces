import { describe, expect, it } from 'vitest'
import { ROUTES } from '@app/shared/config/routes'
import { authRedirect } from './auth-redirect'

describe('authRedirect', () => {
  it('sends a sessionless user from an app route to login', () => {
    expect(authRedirect(ROUTES.home, null)).toBe(ROUTES.login)
  })

  it('lets a sessionless user stay on auth routes', () => {
    expect(authRedirect(ROUTES.login, null)).toBeNull()
    expect(authRedirect(ROUTES.signup, null)).toBeNull()
    expect(authRedirect(ROUTES.forgot, null)).toBeNull()
  })

  it('bounces an account away from login/signup/forgot', () => {
    expect(authRedirect(ROUTES.login, 'account')).toBe(ROUTES.home)
    expect(authRedirect(ROUTES.signup, 'account')).toBe(ROUTES.home)
    expect(authRedirect(ROUTES.forgot, 'account')).toBe(ROUTES.home)
  })

  it('allows the welcome route post-signup (account)', () => {
    expect(authRedirect(ROUTES.welcome, 'account')).toBeNull()
  })

  it('leaves an account on app routes', () => {
    expect(authRedirect(ROUTES.home, 'account')).toBeNull()
    expect(authRedirect(ROUTES.settings, 'account')).toBeNull()
  })

  it('lets a guest reach the auth screens to upgrade, and use the app', () => {
    expect(authRedirect(ROUTES.login, 'guest')).toBeNull()
    expect(authRedirect(ROUTES.signup, 'guest')).toBeNull()
    expect(authRedirect(ROUTES.home, 'guest')).toBeNull()
  })
})
