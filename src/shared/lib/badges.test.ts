import { describe, expect, it } from 'vitest'
import { type BadgeInput, computeBadges, milestoneProgress, nextMilestone } from './badges'

const ZERO: BadgeInput = {
  xp: 0,
  longestStreak: 0,
  decksCompleted: 0,
  deckCount: 0,
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

describe('milestoneProgress', () => {
  it('measures the fraction from the last reached tier to the next', () => {
    const xp = computeBadges({ ...ZERO, xp: 500 })[0]! // 0 → 1000, halfway
    expect(milestoneProgress(xp)).toBeCloseTo(0.5)
  })

  it('reports a maxed badge as complete', () => {
    const streak = computeBadges({ ...ZERO, longestStreak: 1000 }).find((b) => b.id === 'streak')!
    expect(milestoneProgress(streak)).toBe(1)
  })
})

describe('nextMilestone', () => {
  it('picks the badge with the most progress toward its next tier', () => {
    // streak 6/7 (0.857) beats xp 500/1000 (0.5).
    const badges = computeBadges({ ...ZERO, xp: 500, longestStreak: 6 })
    expect(nextMilestone(badges)?.id).toBe('streak')
  })

  it('ignores maxed badges', () => {
    const badges = computeBadges({ ...ZERO, longestStreak: 1000, xp: 10 })
    expect(nextMilestone(badges)?.id).not.toBe('streak')
  })

  it('returns null only when every badge is maxed', () => {
    const maxed = computeBadges({
      xp: 1_000_000,
      longestStreak: 1000,
      decksCompleted: 1000,
      deckCount: 1000,
      totalCards: 10000,
      trainingDayCount: 1000,
    })
    expect(nextMilestone(maxed)).toBeNull()
  })
})
