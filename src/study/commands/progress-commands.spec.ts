import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import type { Progress } from '@/study/model/progress'
import { awardXp, recordQuizResult, recordTrainingDay } from './progress-index'
import { ProgressStore } from '@/study/data/progress-store'

const NOW = Date.UTC(2026, 0, 10)
const DAY = 86_400_000

function startedStore(seed: Progress[] = []) {
  const store = new ProgressStore(new InMemoryRepository<Progress>(seed))
  store.start()
  return store
}

describe('awardXp', () => {
  it('creates the singleton record and adds XP on the first award', async () => {
    const store = startedStore()
    const progress = await awardXp(store, 100, NOW)
    expect(progress.xp).toBe(100)
    expect(store.progress()?.xp).toBe(100)
  })

  it('accumulates XP across awards', async () => {
    const store = startedStore()
    await awardXp(store, 100, NOW)
    const progress = await awardXp(store, 60, NOW)
    expect(progress.xp).toBe(160)
  })

  it('ignores non-positive amounts', async () => {
    const store = startedStore()
    const progress = await awardXp(store, -50, NOW)
    expect(progress.xp).toBe(0)
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = startedStore()
    const progress = await awardXp(store, 20, NOW)
    expect(progress.updatedAt).toBe(new Date(NOW).toISOString())
  })
})

describe('recordTrainingDay', () => {
  it('starts a streak at 1 on the first training day', async () => {
    const store = startedStore()
    const { progress, result } = await recordTrainingDay(store, NOW)
    expect(progress.streakCount).toBe(1)
    expect(result.alreadyTrainedToday).toBe(false)
    expect(progress.trainingDays).toContain('2026-01-10')
  })

  it('is idempotent within the same UTC day', async () => {
    const store = startedStore()
    await recordTrainingDay(store, NOW)
    const { result } = await recordTrainingDay(store, NOW + 3_600_000)
    expect(result.alreadyTrainedToday).toBe(true)
    expect(store.progress()?.streakCount).toBe(1)
  })

  it('continues the streak on a consecutive day', async () => {
    const store = startedStore()
    await recordTrainingDay(store, NOW)
    const { progress } = await recordTrainingDay(store, NOW + DAY)
    expect(progress.streakCount).toBe(2)
  })
})

describe('recordQuizResult', () => {
  it('keeps only the best accuracy', async () => {
    const store = startedStore()
    await recordQuizResult(store, 60, NOW)
    expect((await recordQuizResult(store, 90, NOW)).bestQuizAccuracy).toBe(90)
    expect((await recordQuizResult(store, 70, NOW)).bestQuizAccuracy).toBe(90)
  })
})
