import { describe, expect, it } from 'vitest'
import { AuthError } from '@/shared/api'
import { authErrorKey, authErrorMessage } from './auth-error-copy'

const translate = (key: string) => `translated:${key}`

describe('authErrorKey', () => {
  it('maps a known provider code to its copy', () => {
    expect(
      authErrorKey(new AuthError('email rate limit exceeded', 'over_email_send_rate_limit')),
    ).toBe('auth.errors.emailRateLimit')
    expect(authErrorKey(new AuthError('bad', 'invalid_credentials'))).toBe(
      'auth.errors.invalidCredentials',
    )
  })

  it('has no key for an unknown code or a plain error', () => {
    expect(authErrorKey(new AuthError('boom', 'some_new_code'))).toBeNull()
    expect(authErrorKey(new Error('boom'))).toBeNull()
    expect(authErrorKey('boom')).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('prefers copy a person can act on', () => {
    const error = new AuthError('email rate limit exceeded', 'over_email_send_rate_limit')

    expect(authErrorMessage(error, translate, 'fallback')).toBe(
      'translated:auth.errors.emailRateLimit',
    )
  })

  it('shows the provider message when the code is unrecognised, rather than hiding it', () => {
    expect(authErrorMessage(new AuthError('something new', 'nope'), translate, 'fallback')).toBe(
      'something new',
    )
  })

  it('falls back only when there is nothing to show', () => {
    expect(authErrorMessage(new Error(''), translate, 'fallback')).toBe('fallback')
    expect(authErrorMessage(undefined, translate, 'fallback')).toBe('fallback')
  })
})
