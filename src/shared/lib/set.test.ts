import { describe, expect, it } from 'vitest'
import { toggleInSet } from './set'

describe('toggleInSet', () => {
  it('adds a value the set is missing', () => {
    expect([...toggleInSet(new Set(['a']), 'b')]).toEqual(['a', 'b'])
  })

  it('removes a value the set already holds', () => {
    expect([...toggleInSet(new Set(['a', 'b']), 'a')]).toEqual(['b'])
  })

  it('returns a copy, leaving the original set alone', () => {
    const original = new Set(['a'])
    const next = toggleInSet(original, 'b')
    expect(next).not.toBe(original)
    expect([...original]).toEqual(['a'])
  })
})
