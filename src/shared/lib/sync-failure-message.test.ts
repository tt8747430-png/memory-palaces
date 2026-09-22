import { describe, expect, it } from 'vitest'
import { syncFailureMessage } from './sync-failure-message'

const t = ((key: string) => `t:${key}`) as never

describe('syncFailureMessage', () => {
  it('says what a refused token, a wrong clock and a lost connection mean, in the app’s own words', () => {
    expect(syncFailureMessage(t, 'token')).toBe('t:sync.failure.token')
    expect(syncFailureMessage(t, 'clock')).toBe('t:sync.failure.clock')
    expect(syncFailureMessage(t, 'network')).toBe('t:sync.failure.network')
  })

  it('repeats anything else as the server said it', () => {
    expect(syncFailureMessage(t, 'duplicate key value')).toBe('duplicate key value')
  })

  it('has nothing to say about no reason at all', () => {
    expect(syncFailureMessage(t, null)).toBeNull()
    expect(syncFailureMessage(t, '')).toBeNull()
  })
})
