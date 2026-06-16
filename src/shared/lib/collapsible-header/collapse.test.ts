import { describe, expect, it } from 'vitest'
import { compactOpacity, heroOpacity, heroScale, heroY } from './collapse'

const D = 120

describe('heroOpacity', () => {
  it('is full at the top and fades to 0 across the distance', () => {
    expect(heroOpacity(0, D)).toBe(1)
    expect(heroOpacity(D, D)).toBe(0)
    expect(heroOpacity(D / 2, D)).toBeCloseTo(0.5)
  })

  it('clamps beyond both ends', () => {
    expect(heroOpacity(-50, D)).toBe(1)
    expect(heroOpacity(D * 2, D)).toBe(0)
  })
})

describe('heroScale / heroY (parallax)', () => {
  it('scales 1 → 0.96 and drifts 0 → 28 across the distance', () => {
    expect(heroScale(0, D, false)).toBe(1)
    expect(heroScale(D, D, false)).toBeCloseTo(0.96)
    expect(heroY(0, D, false)).toBe(0)
    expect(heroY(D, D, false)).toBeCloseTo(28)
  })

  it('is a no-op under reduced motion (scale stays 1, y stays 0)', () => {
    expect(heroScale(D, D, true)).toBe(1)
    expect(heroY(D, D, true)).toBe(0)
  })
})

describe('compactOpacity', () => {
  it('stays hidden until the hero has mostly receded, then fades in', () => {
    expect(compactOpacity(0, D)).toBe(0)
    expect(compactOpacity(D * 0.55, D)).toBe(0)
    expect(compactOpacity(D, D)).toBe(1)
    expect(compactOpacity(D * 2, D)).toBe(1)
  })
})
