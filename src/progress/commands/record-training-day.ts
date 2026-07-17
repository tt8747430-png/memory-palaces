import { recordTrainingDay as advanceStreak, type StreakResult } from '@/shared/domain'
import type { Progress } from '../model/progress'
import type { ProgressStore } from '../data/progress-store'
import { currentProgress } from './current-progress'

export interface RecordTrainingDayOutcome {
  progress: Progress
  result: StreakResult
}

export async function recordTrainingDay(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<RecordTrainingDayOutcome> {
  const base = currentProgress(store, now)
  const result = advanceStreak(base, now)
  const updated: Progress = result.alreadyTrainedToday
    ? base
    : { ...base, ...result.state, updatedAt: new Date(now).toISOString() }
  await store.save(updated)
  return { progress: updated, result }
}
