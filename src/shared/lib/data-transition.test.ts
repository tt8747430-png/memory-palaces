import { describe, expect, it } from 'vitest'
import type { PersistedAuth } from '@/shared/api'
import { resolveDataTransition } from './data-transition'

const guest: PersistedAuth = { id: 'g1', kind: 'guest' }
const ada: PersistedAuth = { id: 'a', kind: 'account' }
const grace: PersistedAuth = { id: 'b', kind: 'account' }

describe('resolveDataTransition', () => {
  it('preserves local data when a guest becomes an account', () => {
    expect(resolveDataTransition(guest, ada)).toBe('preserve')
    expect(resolveDataTransition(null, ada)).toBe('preserve')
  })

  it('resets when switching between two different accounts', () => {
    expect(resolveDataTransition(ada, grace)).toBe('reset')
  })

  it('does nothing for the same account', () => {
    expect(resolveDataTransition(ada, ada)).toBe('none')
    expect(resolveDataTransition({ ...ada, name: 'renamed' }, ada)).toBe('none')
  })

  it('does nothing on sign-out or when continuing as a guest', () => {
    expect(resolveDataTransition(ada, null)).toBe('none')
    expect(resolveDataTransition(ada, guest)).toBe('none')
    expect(resolveDataTransition(null, guest)).toBe('none')
  })
})
