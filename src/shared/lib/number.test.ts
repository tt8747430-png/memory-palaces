import { describe, expect, it } from 'vitest'
import { clamp, clamp01, percentOf } from './number'

describe('clamp', () => {
  it('leaves a value inside the range alone', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('pins to the bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('clamp01', () => {
  it('pins to the unit range', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0.25)).toBe(0.25)
    expect(clamp01(1.5)).toBe(1)
  })
})

describe('percentOf', () => {
  it('rounds the fraction to a whole percent', () => {
    expect(percentOf(1, 3)).toBe(33)
    expect(percentOf(2, 4)).toBe(50)
  })

  it('never overflows the bar', () => {
    expect(percentOf(9, 4)).toBe(100)
    expect(percentOf(-1, 4)).toBe(0)
  })

  it('reads an empty total as nothing done', () => {
    expect(percentOf(3, 0)).toBe(0)
  })
})
