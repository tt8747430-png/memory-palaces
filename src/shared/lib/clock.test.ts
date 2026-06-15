import { describe, expect, it } from 'vitest'
import { fixedClock, systemClock } from './clock'

describe('clock', () => {
  it('fixedClock returns the same instant on every call', () => {
    const clock = fixedClock(1_000)
    expect(clock.now()).toBe(1_000)
    expect(clock.now()).toBe(1_000)
  })

  it('systemClock advances with wall-clock time', () => {
    const before = Date.now()
    expect(systemClock.now()).toBeGreaterThanOrEqual(before)
  })
})
