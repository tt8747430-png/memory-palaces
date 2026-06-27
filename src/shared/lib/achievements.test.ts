import { describe, expect, it } from 'vitest'
import { type AchievementInput, computeAchievements } from './achievements'

const base: AchievementInput = {
  palaceCount: 0,
  streakCount: 0,
  xp: 0,
  bestQuizAccuracy: 0,
  roomsCompleted: 0,
  anyPalaceCompleted: false,
}

const earnedIds = (input: AchievementInput) =>
  computeAchievements(input)
    .filter((a) => a.earned)
    .map((a) => a.id)

describe('computeAchievements', () => {
  it('returns the six badges in canonical order', () => {
    expect(computeAchievements(base).map((a) => a.id)).toEqual([
      'first-palace',
      'week-warrior',
      'palace-master',
      'xp-champion',
      'perfectionist',
      'dedicated-learner',
    ])
  })

  it('earns nothing from a blank slate', () => {
    expect(earnedIds(base)).toEqual([])
  })

  it('earns first-palace with at least one palace', () => {
    expect(earnedIds({ ...base, palaceCount: 1 })).toContain('first-palace')
  })

  it('earns week-warrior at a 7-day streak, not 6', () => {
    expect(earnedIds({ ...base, streakCount: 6 })).not.toContain('week-warrior')
    expect(earnedIds({ ...base, streakCount: 7 })).toContain('week-warrior')
  })

  it('earns palace-master when any palace is fully complete', () => {
    expect(earnedIds({ ...base, anyPalaceCompleted: true })).toContain('palace-master')
  })

  it('earns xp-champion at 2000 XP, not 1999', () => {
    expect(earnedIds({ ...base, xp: 1999 })).not.toContain('xp-champion')
    expect(earnedIds({ ...base, xp: 2000 })).toContain('xp-champion')
  })

  it('earns perfectionist only at 100% accuracy', () => {
    expect(earnedIds({ ...base, bestQuizAccuracy: 99 })).not.toContain('perfectionist')
    expect(earnedIds({ ...base, bestQuizAccuracy: 100 })).toContain('perfectionist')
  })

  it('earns dedicated-learner at 10 completed rooms, not 9', () => {
    expect(earnedIds({ ...base, roomsCompleted: 9 })).not.toContain('dedicated-learner')
    expect(earnedIds({ ...base, roomsCompleted: 10 })).toContain('dedicated-learner')
  })
})
