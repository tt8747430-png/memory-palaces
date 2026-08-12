import { describe, expect, it } from 'vitest'
import type { Progress } from '@/entities/progress'
import { mergeProgress } from './merge-progress'

const base: Progress = {
  id: 'p1',
  createdAt: 't0',
  updatedAt: 't1',
  xp: 100,
  streakCount: 3,
  longestStreak: 5,
  lastTrainingDate: '2026-07-20',
  streakFreezes: 1,
  bestQuizAccuracy: 0.8,
  trainingDays: ['2026-07-19', '2026-07-20'],
  activeDayKey: '2026-07-20',
  activeDayCount: 4,
}

describe('mergeProgress', () => {
  it('keeps the max of monotonic counters and unions training days', () => {
    const local = { ...base, updatedAt: 't2', xp: 150, trainingDays: ['2026-07-20', '2026-07-21'] }
    const remote = {
      ...base,
      updatedAt: 't1',
      xp: 120,
      longestStreak: 9,
      trainingDays: ['2026-07-18'],
    }

    const merged = mergeProgress(local, remote)

    expect(merged.xp).toBe(150)
    expect(merged.longestStreak).toBe(9)
    expect(merged.trainingDays).toEqual(['2026-07-18', '2026-07-20', '2026-07-21'])
    expect(merged.lastTrainingDate).toBe('2026-07-20')
    expect(merged.activeDayKey).toBe('2026-07-20')
  })

  it('is symmetric — either side may be the newer write', () => {
    const local = { ...base, updatedAt: 't1', xp: 120 }
    const remote = { ...base, updatedAt: 't2', xp: 150, streakFreezes: 3 }

    expect(mergeProgress(local, remote)).toEqual(mergeProgress(remote, local))
  })

  it('takes the daily-tracking fields from the newest write', () => {
    const local = { ...base, updatedAt: 't3', activeDayKey: '2026-07-21', activeDayCount: 2 }
    const remote = { ...base, updatedAt: 't2', activeDayKey: '2026-07-20', activeDayCount: 9 }

    const merged = mergeProgress(local, remote)

    expect(merged.activeDayKey).toBe('2026-07-21')
    // A new day resets the counter, so counting the same day twice would be wrong.
    expect(merged.activeDayCount).toBe(2)
  })

  it('sums nothing when a device has never trained', () => {
    const fresh = { ...base, updatedAt: 't0', xp: 0, trainingDays: [], lastTrainingDate: null }

    expect(mergeProgress(fresh, base)).toMatchObject({
      xp: 100,
      lastTrainingDate: '2026-07-20',
      trainingDays: ['2026-07-19', '2026-07-20'],
    })
  })
})
