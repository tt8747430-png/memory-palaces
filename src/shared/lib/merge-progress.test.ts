import { describe, expect, it } from 'vitest'
import type { Progress } from '@/entities/progress'
import { mergeProgress, mergeProgressAgainst } from './merge-progress'

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

  it('takes the daily tally from the later day', () => {
    const local = { ...base, updatedAt: 't3', activeDayKey: '2026-07-21', activeDayCount: 2 }
    const remote = { ...base, updatedAt: 't2', activeDayKey: '2026-07-20', activeDayCount: 9 }

    const merged = mergeProgress(local, remote)

    expect(merged.activeDayKey).toBe('2026-07-21')
    expect(merged.activeDayCount).toBe(2)
    expect(mergeProgress(remote, local)).toEqual(merged)
  })

  it('keeps the higher count when both devices studied the same day', () => {
    const local = { ...base, updatedAt: 't3', activeDayKey: '2026-07-21', activeDayCount: 3 }
    const remote = { ...base, updatedAt: 't4', activeDayKey: '2026-07-21', activeDayCount: 7 }

    const merged = mergeProgress(local, remote)

    expect(merged.activeDayKey).toBe('2026-07-21')
    expect(merged.activeDayCount).toBe(7)
  })

  it('adopts a day tally from a device that has one when the other never studied', () => {
    const local: Progress = { ...base, updatedAt: 't3', activeDayKey: null, activeDayCount: 0 }
    const remote: Progress = {
      ...base,
      updatedAt: 't2',
      activeDayKey: '2026-07-21',
      activeDayCount: 5,
    }

    expect(mergeProgress(local, remote)).toMatchObject({
      activeDayKey: '2026-07-21',
      activeDayCount: 5,
    })
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

describe('mergeProgressAgainst', () => {
  it('adds what each device earned on top of what both had seen', () => {
    const mine = { ...base, updatedAt: 't2', xp: 110, streakFreezes: 0 }
    const theirs = { ...base, updatedAt: 't3', xp: 120, streakFreezes: 3 }
    expect(mergeProgressAgainst(mine, theirs, base)).toMatchObject({ xp: 130, streakFreezes: 2 })
  })

  it('leaves a counter only one device moved at that device’s value', () => {
    const mine = { ...base, updatedAt: 't2', xp: 90 }
    const theirs = { ...base, updatedAt: 't3', longestStreak: 9 }
    expect(mergeProgressAgainst(mine, theirs, base)).toMatchObject({ xp: 90, longestStreak: 9 })
  })

  it('settles the day tally as one pair, from the later day', () => {
    const mine = { ...base, updatedAt: 't3', activeDayKey: '2026-07-21', activeDayCount: 2 }
    const theirs = { ...base, updatedAt: 't2', activeDayKey: '2026-07-22', activeDayCount: 1 }
    expect(mergeProgressAgainst(mine, theirs, base)).toMatchObject({
      activeDayKey: '2026-07-22',
      activeDayCount: 1,
    })
  })

  it('unions training days both devices added to', () => {
    const mine = { ...base, updatedAt: 't2', trainingDays: [...base.trainingDays, '2026-07-21'] }
    const theirs = { ...base, updatedAt: 't3', trainingDays: [...base.trainingDays, '2026-07-22'] }
    expect(mergeProgressAgainst(mine, theirs, base).trainingDays).toEqual([
      '2026-07-19',
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
    ])
  })
})
