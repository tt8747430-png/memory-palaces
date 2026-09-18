import { describe, expect, it } from 'vitest'
import { chunk } from './chunk'

describe('chunk', () => {
  it('cuts a list into runs of at most the given size, in order', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2], 2)).toEqual([[1, 2]])
  })

  it('makes nothing of nothing', () => {
    expect(chunk([], 3)).toEqual([])
  })

  it('refuses a size that would never finish', () => {
    expect(() => chunk([1], 0)).toThrow()
  })
})
