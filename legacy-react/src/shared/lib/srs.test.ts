import { describe, expect, it } from 'vitest'
import { isDue, markKnown, nextIntervalLabel, schedule, type SrsState, srsStatus } from './srs'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 0, 1)

describe('isDue', () => {
  it('treats a card with no state as due (brand new)', () => {
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it('is due when the due date is at or before now', () => {
    const srs = schedule(undefined, 'good', NOW)
    expect(isDue(srs, NOW)).toBe(false)
    expect(isDue(srs, NOW + DAY_MS)).toBe(true)
  })
})

describe('schedule', () => {
  it('"again" resets reps/interval, records a lapse, and lowers ease', () => {
    const prev: SrsState = {
      due: new Date(NOW).toISOString(),
      interval: 10,
      ease: 2.5,
      reps: 4,
      lapses: 0,
      lastReviewed: new Date(NOW).toISOString(),
    }
    const next = schedule(prev, 'again', NOW)
    expect(next.reps).toBe(0)
    expect(next.interval).toBe(0)
    expect(next.lapses).toBe(1)
    expect(next.ease).toBeCloseTo(2.3)
    expect(next.due).toBe(new Date(NOW).toISOString())
  })

  it('"good" steps 1 → 3 → interval*ease', () => {
    const first = schedule(undefined, 'good', NOW)
    expect(first.interval).toBe(1)
    expect(first.reps).toBe(1)
    const second = schedule(first, 'good', NOW)
    expect(second.interval).toBe(3)
    const third = schedule(second, 'good', NOW)
    expect(third.interval).toBe(Math.round(3 * second.ease))
  })

  it('"easy" steps 2 → 5 and raises ease', () => {
    const first = schedule(undefined, 'easy', NOW)
    expect(first.interval).toBe(2)
    expect(first.ease).toBeCloseTo(2.65)
    const second = schedule(first, 'easy', NOW)
    expect(second.interval).toBe(5)
  })

  it('clamps ease at the 1.3 floor under repeated failure', () => {
    let srs = schedule(undefined, 'good', NOW)
    for (let i = 0; i < 20; i++) srs = schedule(srs, 'again', NOW)
    expect(srs.ease).toBeGreaterThanOrEqual(1.3)
    expect(srs.ease).toBeCloseTo(1.3)
  })

  it('computes the due date from the injected now, not the wall clock', () => {
    const next = schedule(undefined, 'easy', NOW)
    expect(next.due).toBe(new Date(NOW + 2 * DAY_MS).toISOString())
    expect(next.lastReviewed).toBe(new Date(NOW).toISOString())
  })
})

describe('srsStatus (maturity)', () => {
  it('is "new" with no reps', () => {
    expect(srsStatus(undefined)).toBe('new')
  })

  it('reports maturity regardless of due date', () => {
    const card = schedule(undefined, 'good', NOW)
    expect(srsStatus(card)).toBe('learning')
    const pastDue: SrsState = { ...card, due: new Date(NOW - DAY_MS).toISOString() }
    expect(srsStatus(pastDue)).toBe('learning')
  })

  it('is "learning" below the mature interval and "known" at/above it', () => {
    const learning = schedule(undefined, 'good', NOW)
    expect(srsStatus(learning)).toBe('learning')
    const known: SrsState = { ...learning, interval: 21 }
    expect(srsStatus(known)).toBe('known')
  })
})

describe('markKnown', () => {
  it('forces a long mature interval', () => {
    const known = markKnown(undefined, NOW)
    expect(known.interval).toBe(180)
    expect(known.reps).toBeGreaterThanOrEqual(4)
    expect(srsStatus(known)).toBe('known')
  })
})

describe('nextIntervalLabel', () => {
  it('formats the projected interval', () => {
    expect(nextIntervalLabel(undefined, 'again', NOW)).toBe('now')
    expect(nextIntervalLabel(undefined, 'good', NOW)).toBe('1d')
    const mature: SrsState = {
      due: new Date(NOW).toISOString(),
      interval: 40,
      ease: 2.5,
      reps: 5,
      lapses: 0,
      lastReviewed: new Date(NOW).toISOString(),
    }
    expect(nextIntervalLabel(mature, 'good', NOW)).toMatch(/mo$/)
  })
})
