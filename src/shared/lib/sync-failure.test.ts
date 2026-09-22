import { describe, expect, it } from 'vitest'
import { syncFailure } from './sync-failure'

describe('syncFailure', () => {
  it('reads the server refusing the token, however it words it', () => {
    expect(syncFailure('invalid JWT: unable to parse or verify signature')).toBe('token')
    expect(syncFailure('JWT expired')).toBe('token')
    expect(syncFailure('PGRST301: JWSError')).toBe('token')
    expect(syncFailure('401: Unauthorized')).toBe('token')
  })

  it('tells a clock apart from an expiry — one of them the learner can fix', () => {
    expect(syncFailure('invalid JWT: token used before issued')).toBe('clock')
    expect(syncFailure('token is issued in the future')).toBe('clock')
    expect(syncFailure('iat is in the future')).toBe('clock')
  })

  it('reads a dropped, aborted or timed-out request as the network, in every browser’s words', () => {
    expect(syncFailure('AbortError: Fetch is aborted')).toBe('network')
    expect(syncFailure('The user aborted a request.')).toBe('network')
    expect(syncFailure('TimeoutError: signal timed out')).toBe('network')
    expect(syncFailure('The operation timed out.')).toBe('network')
    expect(syncFailure('Failed to fetch')).toBe('network')
    expect(syncFailure('Load failed')).toBe('network')
    expect(syncFailure('NetworkError when attempting to fetch resource.')).toBe('network')
  })

  it('leaves an ordinary failure alone', () => {
    expect(syncFailure('duplicate key value violates unique constraint')).toBeNull()
    expect(syncFailure('')).toBeNull()
  })
})
