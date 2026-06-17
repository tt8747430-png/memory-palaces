import { describe, expect, it } from 'vitest'
import { computeBadges, type BadgeInput } from './badges'

const ZERO: BadgeInput = {
  xp: 0,
  longestStreak: 0,
  roomsCompleted: 0,
  palaceCount: 0,
  totalCards: 0,
  trainingDayCount: 0,
}

describe('computeBadges', () => {
  it('returns the six badges in canonical order, all locked at zero', () => {
    const badges = computeBadges(ZERO)
    expect(badges.map((b) => b.id)).toEqual(['xp', 'streak', 'rooms', 'palaces', 'cards', 'days'])
    expect(badges.every((b) => b.tier === 0)).toBe(true)
    expect(badges.every((b) => b.current === null)).toBe(true)
    // The next target is the first threshold while locked.
    expect(badges[0]!.next).toBe(1000)
  })

  it('counts reached tiers and tracks current/next thresholds', () => {
    const [xp] = computeBadges({ ...ZERO, xp: 6000 }) // passes 1000, 2500, 5000
    expect(xp!.tier).toBe(3)
    expect(xp!.current).toBe(5000)
    expect(xp!.next).toBe(10000)
  })

  it('maxes out with no next threshold', () => {
    const streak = computeBadges({ ...ZERO, longestStreak: 1000 }).find((b) => b.id === 'streak')!
    expect(streak.tier).toBe(streak.tiers.length)
    expect(streak.current).toBe(365)
    expect(streak.next).toBeNull()
  })
})
