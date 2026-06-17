import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/shared/config/routes'
import { authRedirect } from './auth-guard'

describe('authRedirect', () => {
  it('sends an unauthenticated user from an app route to login', () => {
    expect(authRedirect(ROUTES.home, false)).toBe(ROUTES.login)
    expect(authRedirect(ROUTES.palaces, false)).toBe(ROUTES.login)
  })

  it('lets an unauthenticated user stay on auth routes', () => {
    expect(authRedirect(ROUTES.login, false)).toBeNull()
    expect(authRedirect(ROUTES.signup, false)).toBeNull()
    expect(authRedirect(ROUTES.forgot, false)).toBeNull()
  })

  it('bounces an authenticated user away from login/signup/forgot', () => {
    expect(authRedirect(ROUTES.login, true)).toBe(ROUTES.home)
    expect(authRedirect(ROUTES.signup, true)).toBe(ROUTES.home)
    expect(authRedirect(ROUTES.forgot, true)).toBe(ROUTES.home)
  })

  it('allows the welcome route post-signup (authenticated)', () => {
    expect(authRedirect(ROUTES.welcome, true)).toBeNull()
  })

  it('leaves an authenticated user on app routes', () => {
    expect(authRedirect(ROUTES.home, true)).toBeNull()
    expect(authRedirect(ROUTES.settings, true)).toBeNull()
  })
})
