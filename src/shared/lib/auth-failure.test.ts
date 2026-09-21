import { describe, expect, it } from 'vitest'
import { authFailure } from './auth-failure'

describe('authFailure', () => {
  it('reads the server refusing the token, however it words it', () => {
    expect(authFailure('invalid JWT: unable to parse or verify signature')).toBe('token')
    expect(authFailure('JWT expired')).toBe('token')
    expect(authFailure('PGRST301: JWSError')).toBe('token')
    expect(authFailure('401: Unauthorized')).toBe('token')
  })

  it('tells a clock apart from an expiry — one of them the learner can fix', () => {
    expect(authFailure('invalid JWT: token used before issued')).toBe('clock')
    expect(authFailure('token is issued in the future')).toBe('clock')
    expect(authFailure('iat is in the future')).toBe('clock')
  })

  it('leaves an ordinary failure alone', () => {
    expect(authFailure('Failed to fetch')).toBeNull()
    expect(authFailure('duplicate key value violates unique constraint')).toBeNull()
    expect(authFailure('')).toBeNull()
  })
})
