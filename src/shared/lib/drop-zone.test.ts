import { describe, expect, it } from 'vitest'
import { dropZone } from './drop-zone'

const row = { top: 100, height: 60 }

describe('dropZone', () => {
  it('reads the middle of a row as dropping into it', () => {
    expect(dropZone(130, row)).toBe('nest')
  })

  it('reads the edges of a row as dropping between rows', () => {
    expect(dropZone(105, row)).toBe('before')
    expect(dropZone(155, row)).toBe('after')
  })

  it('gives the middle band to nesting, not to the seams', () => {
    // A thumb landing anywhere near the centre must nest, not reorder.
    const middle = [0.35, 0.5, 0.65].map((r) => dropZone(row.top + r * row.height, row))
    expect(middle).toEqual(['nest', 'nest', 'nest'])
  })

  it('splits the row in half when the target cannot be nested into', () => {
    expect(dropZone(row.top + 0.4 * row.height, row, false)).toBe('before')
    expect(dropZone(row.top + 0.6 * row.height, row, false)).toBe('after')
  })

  it('resolves a pointer that has left the row', () => {
    expect(dropZone(0, row)).toBe('before')
    expect(dropZone(999, row)).toBe('after')
  })

  it('still resolves an unmeasured row', () => {
    expect(dropZone(10, { top: 0, height: 0 })).toBe('nest')
  })
})
