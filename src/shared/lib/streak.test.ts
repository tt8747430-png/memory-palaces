import { describe, expect, it } from 'vitest'
import {
  buildDayCells,
  dayKey,
  recordPractice,
  recordTrainingDay,
  totalTrainingDays,
  type DailyTally,
  type StreakState,
} from './streak'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 0, 10) // 2026-01-10

const empty: StreakState = {
  streakCount: 0,
  longestStreak: 0,
  lastTrainingDate: null,
  streakFreezes: 0,
  trainingDays: [],
}

describe('dayKey', () => {
  it('is the YYYY-MM-DD UTC day for an instant', () => {
    expect(dayKey(NOW)).toBe('2026-01-10')
  })
})

describe('recordTrainingDay', () => {
  it('starts a streak at 1 on the first training day', () => {
    const { state } = recordTrainingDay(empty, NOW)
    expect(state.streakCount).toBe(1)
    expect(state.longestStreak).toBe(1)
    expect(state.lastTrainingDate).toBe('2026-01-10')
    expect(state.trainingDays).toEqual(['2026-01-10'])
  })

  it('is idempotent when already trained today', () => {
    const trained: StreakState = {
      ...empty,
      streakCount: 3,
      lastTrainingDate: '2026-01-10',
      trainingDays: ['2026-01-10'],
    }
    const result = recordTrainingDay(trained, NOW)
    expect(result.alreadyTrainedToday).toBe(true)
    expect(result.state).toBe(trained)
  })

  it('increments on a consecutive day', () => {
    const yesterday: StreakState = {
      ...empty,
      streakCount: 4,
      longestStreak: 4,
      lastTrainingDate: '2026-01-09',
      trainingDays: ['2026-01-09'],
    }
    const { state, continued } = recordTrainingDay(yesterday, NOW)
    expect(continued).toBe(true)
    expect(state.streakCount).toBe(5)
    expect(state.longestStreak).toBe(5)
  })

  it('spends a freeze to forgive exactly one missed day', () => {
    const gapWithFreeze: StreakState = {
      ...empty,
      streakCount: 6,
      longestStreak: 6,
      lastTrainingDate: '2026-01-08',
      streakFreezes: 1,
      trainingDays: ['2026-01-08'],
    }
    const { state, usedFreeze } = recordTrainingDay(gapWithFreeze, NOW)
    expect(usedFreeze).toBe(true)
    expect(state.streakCount).toBe(7)
    // one freeze spent, but a 7-day milestone restocks one
    expect(state.streakFreezes).toBe(1)
  })

  it('resets to 1 after a missed day with no freeze, preserving the longest', () => {
    const gapNoFreeze: StreakState = {
      ...empty,
      streakCount: 9,
      longestStreak: 9,
      lastTrainingDate: '2026-01-08',
      streakFreezes: 0,
      trainingDays: ['2026-01-08'],
    }
    const { state, continued } = recordTrainingDay(gapNoFreeze, NOW)
    expect(continued).toBe(false)
    expect(state.streakCount).toBe(1)
    expect(state.longestStreak).toBe(9)
  })

  it('restocks a freeze at a 7-day milestone (capped at 2)', () => {
    const day6: StreakState = {
      ...empty,
      streakCount: 6,
      longestStreak: 6,
      lastTrainingDate: '2026-01-09',
      streakFreezes: 0,
      trainingDays: ['2026-01-09'],
    }
    const { state, isMilestone } = recordTrainingDay(day6, NOW)
    expect(state.streakCount).toBe(7)
    expect(isMilestone).toBe(true)
    expect(state.streakFreezes).toBe(1)
  })

  it('caps training-day history at 365 entries', () => {
    const history = Array.from({ length: 365 }, (_, i) => dayKey(NOW - (400 - i) * DAY_MS))
    const long: StreakState = {
      ...empty,
      streakCount: 1,
      lastTrainingDate: history[history.length - 1]!,
      trainingDays: history,
    }
    const { state } = recordTrainingDay(long, NOW)
    expect(state.trainingDays).toHaveLength(365)
    expect(state.trainingDays[state.trainingDays.length - 1]).toBe('2026-01-10')
  })
})

describe('recordPractice', () => {
  const base: StreakState & DailyTally = { ...empty, activeDayKey: null, activeDayCount: 0 }

  it('accumulates below the goal without advancing the streak', () => {
    const out = recordPractice(base, 3, 5, NOW)
    expect(out.dayCount).toBe(3)
    expect(out.becameActive).toBe(false)
    expect(out.streak.streakCount).toBe(0)
    expect(out.streak.trainingDays).toEqual([])
    expect(out.tally).toEqual({ activeDayKey: '2026-01-10', activeDayCount: 3 })
  })

  it('marks the day active and advances the streak when the goal is reached', () => {
    const partial: StreakState & DailyTally = {
      ...base,
      activeDayKey: '2026-01-10',
      activeDayCount: 4,
    }
    const out = recordPractice(partial, 1, 5, NOW)
    expect(out.dayCount).toBe(5)
    expect(out.becameActive).toBe(true)
    expect(out.streak.streakCount).toBe(1)
    expect(out.streak.trainingDays).toEqual(['2026-01-10'])
  })

  it('resets the tally when the day rolls over', () => {
    const yesterday: StreakState & DailyTally = {
      ...base,
      activeDayKey: '2026-01-09',
      activeDayCount: 9,
    }
    const out = recordPractice(yesterday, 2, 5, NOW)
    expect(out.dayCount).toBe(2)
    expect(out.becameActive).toBe(false)
  })

  it('only advances once per day (further practice just bumps the tally)', () => {
    const active: StreakState & DailyTally = {
      ...base,
      streakCount: 1,
      lastTrainingDate: '2026-01-10',
      trainingDays: ['2026-01-10'],
      activeDayKey: '2026-01-10',
      activeDayCount: 5,
    }
    const out = recordPractice(active, 3, 5, NOW)
    expect(out.dayCount).toBe(8)
    expect(out.becameActive).toBe(false)
    expect(out.streak.streakCount).toBe(1)
  })

  it('merges streak + tally into one applyable state', () => {
    const out = recordPractice(base, 5, 5, NOW)
    expect(out.state).toEqual({ ...out.streak, ...out.tally })
    expect(out.state.streakCount).toBe(out.streak.streakCount)
    expect(out.state.activeDayCount).toBe(out.tally.activeDayCount)
  })
})

describe('totalTrainingDays', () => {
  it('counts distinct days', () => {
    expect(totalTrainingDays(['2026-01-01', '2026-01-01', '2026-01-02'])).toBe(2)
  })
})

describe('buildDayCells', () => {
  it('returns `count` days ending today, oldest first', () => {
    const cells = buildDayCells([], 7, NOW)
    expect(cells).toHaveLength(7)
    expect(cells[0]?.key).toBe('2026-01-04')
    expect(cells[6]?.key).toBe('2026-01-10')
    expect(cells[6]?.isToday).toBe(true)
    expect(cells[0]?.isToday).toBe(false)
  })

  it('marks the days that were trained (and only on/before today)', () => {
    const cells = buildDayCells(['2026-01-08', '2026-01-10', '2026-01-20'], 7, NOW)
    expect(cells.find((cell) => cell.key === '2026-01-08')?.trained).toBe(true)
    expect(cells.find((cell) => cell.key === '2026-01-09')?.trained).toBe(false)
    expect(cells[6]?.trained).toBe(true)
  })

  it('exposes a three-letter weekday and its initial', () => {
    // 2026-01-10 is a Saturday.
    const today = buildDayCells([], 1, NOW)[0]
    expect(today?.weekdayShort).toBe('Sat')
    expect(today?.weekdayInitial).toBe('S')
  })
})
