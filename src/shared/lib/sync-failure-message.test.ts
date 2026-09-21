import { describe, expect, it } from 'vitest'
import { syncFailureMessage } from './sync-failure-message'

const t = ((key: string) => `t:${key}`) as never

describe('syncFailureMessage', () => {
  it('says what a refused token and a wrong clock mean, in the app’s own words', () => {
    expect(syncFailureMessage(t, 'token')).toBe('t:sync.failure.token')
    expect(syncFailureMessage(t, 'clock')).toBe('t:sync.failure.clock')
  })

  it('repeats anything else as the server said it', () => {
    expect(syncFailureMessage(t, 'Failed to fetch')).toBe('Failed to fetch')
  })

  it('has nothing to say about no reason at all', () => {
    expect(syncFailureMessage(t, null)).toBeNull()
    expect(syncFailureMessage(t, '')).toBeNull()
  })
})
