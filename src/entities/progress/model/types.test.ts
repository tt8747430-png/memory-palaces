import { describe, expect, it } from 'vitest'
import { makeProgress } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makeProgress', () => {
  it('starts empty by default', () => {
    const progress = makeProgress({ id: 'me', createdAt: T0 })
    expect(progress).toEqual({
      id: 'me',
      createdAt: T0,
      updatedAt: T0,
      xp: 0,
      streakCount: 0,
      longestStreak: 0,
      lastTrainingDate: null,
      streakFreezes: 0,
      bestQuizAccuracy: 0,
      trainingDays: [],
    })
  })

  it('copies provided training days and rejects negative xp', () => {
    const days = ['2026-01-01']
    const progress = makeProgress({ id: 'me', createdAt: T0, xp: 100, trainingDays: days })
    expect(progress.xp).toBe(100)
    expect(progress.trainingDays).not.toBe(days)
    expect(() => makeProgress({ id: 'me', createdAt: T0, xp: -1 })).toThrow()
  })
})
