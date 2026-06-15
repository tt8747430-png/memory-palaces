import { recordTrainingDay as advanceStreak, type StreakResult } from '@/shared/lib'
import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

export interface RecordTrainingDayOutcome {
  progress: Progress
  /** Streak flags (milestone, freeze used, …) a notification can later surface. */
  result: StreakResult
}

/** Command — mark today as trained and advance/break/freeze the streak. Idempotent
 * within a UTC day. Progress satisfies `StreakState` structurally, so the pure
 * `shared/lib` streak rule operates on it directly. */
export async function recordTrainingDay(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<RecordTrainingDayOutcome> {
  const base = currentProgress(store, now)
  const result = advanceStreak(base, now)
  const updated: Progress = result.alreadyTrainedToday
    ? base
    : { ...base, ...result.state, updatedAt: new Date(now).toISOString() }
  await store.getState().save(updated)
  return { progress: updated, result }
}
