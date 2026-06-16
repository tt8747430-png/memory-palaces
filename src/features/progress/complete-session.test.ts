import { describe, expect, it } from 'vitest'
import { dayKey } from '@/shared/lib'
import { InMemoryRepository } from '@/shared/api'
import { createProgressStore, makeProgress, type Progress } from '@/entities/progress'
import { completeSession, quizXp, studyXp, XP_MATCH } from './index'

const NOW = Date.UTC(2026, 0, 10)
const DAY = 86_400_000

function startedStore(seed: Progress[] = []) {
  const store = createProgressStore(new InMemoryRepository<Progress>(seed))
  store.getState().start()
  return store
}

describe('reward helpers', () => {
  it('studyXp scales with cards graded, clamped to 20–150', () => {
    expect(studyXp(0)).toBe(20)
    expect(studyXp(10)).toBe(60)
    expect(studyXp(100)).toBe(150)
  })

  it('quizXp is 20 per correct answer', () => {
    expect(quizXp(3)).toBe(60)
  })

  it('XP_MATCH is a flat reward', () => {
    expect(XP_MATCH).toBeGreaterThan(0)
  })
})

describe('completeSession', () => {
  it('awards XP, starts the streak, and persists once', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 100 }, NOW)
    expect(reward.xpGained).toBe(100)
    expect(reward.streakCount).toBe(1)
    expect(reward.alreadyTrainedToday).toBe(false)
    expect(store.getState().progress?.xp).toBe(100)
    expect(store.getState().progress?.trainingDays).toContain('2026-01-10')
  })

  it('reports a level-up when XP crosses a threshold', async () => {
    const store = startedStore()
    await completeSession(store, { xp: 240 }, NOW)
    const reward = await completeSession(store, { xp: 20 }, NOW)
    expect(reward.leveledUp).toBe(true)
    expect(reward.level).toBe(2)
  })

  it('records the best quiz accuracy when provided', async () => {
    const store = startedStore()
    await completeSession(store, { xp: 40, quizAccuracy: 75 }, NOW)
    expect(store.getState().progress?.bestQuizAccuracy).toBe(75)
  })

  it('reports a new best quiz accuracy', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 40, quizAccuracy: 75 }, NOW)
    expect(reward.isBestQuiz).toBe(true)
    expect(reward.quizAccuracy).toBe(75)
  })

  it('does not report a best quiz when the score does not beat the record', async () => {
    const store = startedStore()
    await completeSession(store, { xp: 40, quizAccuracy: 80 }, NOW)
    const reward = await completeSession(store, { xp: 40, quizAccuracy: 60 }, NOW)
    expect(reward.isBestQuiz).toBe(false)
  })

  it('omits quiz fields when no quiz accuracy is supplied', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 40 }, NOW)
    expect(reward.isBestQuiz).toBe(false)
    expect(reward.quizAccuracy).toBeUndefined()
  })

  it('skips the streak when recordDay is false', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 10, recordDay: false }, NOW)
    expect(reward.streakCount).toBe(0)
    expect(store.getState().progress?.trainingDays).toEqual([])
  })

  it('flags a 7-day streak milestone', async () => {
    const target = Date.UTC(2026, 0, 7)
    const seed = makeProgress({
      id: 'progress',
      createdAt: new Date(0).toISOString(),
      streakCount: 6,
      longestStreak: 6,
      lastTrainingDate: dayKey(target - DAY),
      trainingDays: [dayKey(target - DAY)],
    })
    const store = startedStore([seed])
    const reward = await completeSession(store, { xp: 50 }, target)
    expect(reward.streakCount).toBe(7)
    expect(reward.isMilestone).toBe(true)
  })
})
