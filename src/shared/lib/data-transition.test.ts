import { describe, expect, it } from 'vitest'
import { resolveDataTransition } from './data-transition'

describe('resolveDataTransition', () => {
  it('keeps local data when nobody owned it — a fresh install or a guest signing up', () => {
    expect(resolveDataTransition(null, 'a')).toBe('keep')
  })

  it('keeps local data for the account that already owns it', () => {
    expect(resolveDataTransition('a', 'a')).toBe('keep')
  })

  it('resets for a different account, however it got here', () => {
    // Signing out in between clears the session but not the data, so the owner still answers.
    expect(resolveDataTransition('a', 'b')).toBe('reset')
  })
})
