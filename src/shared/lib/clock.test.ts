import { describe, expect, it } from 'vitest'
import { fixedClock, nowIso, systemClock } from './clock'

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

  it('nowIso stamps the instant it is handed', () => {
    expect(nowIso(0)).toBe('1970-01-01T00:00:00.000Z')
  })

  it('nowIso defaults to the current instant', () => {
    const before = Date.now()
    expect(Date.parse(nowIso())).toBeGreaterThanOrEqual(before)
  })
})
