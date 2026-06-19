import { describe, expect, it } from 'vitest'
import { barElevation } from './elevation'

const D = 16

describe('barElevation', () => {
  it('is 0 at the top and 1 once past the distance', () => {
    expect(barElevation(0, D)).toBe(0)
    expect(barElevation(D, D)).toBe(1)
    expect(barElevation(D / 2, D)).toBeCloseTo(0.5)
  })

  it('clamps outside [0, distance]', () => {
    expect(barElevation(-50, D)).toBe(0)
    expect(barElevation(D * 3, D)).toBe(1)
  })
})
