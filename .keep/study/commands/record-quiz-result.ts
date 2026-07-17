import type { Progress } from '@app/study/model/progress'
import type { ProgressStore } from '@app/study/data/progress-store'
import { currentProgress } from './current-progress'

export async function recordQuizResult(
  store: ProgressStore,
  accuracy: number,
  now: number = Date.now(),
): Promise<Progress> {
  const base = currentProgress(store, now)
  const best = Math.max(base.bestQuizAccuracy, Math.round(accuracy))
  const updated: Progress = {
    ...base,
    bestQuizAccuracy: best,
    updatedAt: new Date(now).toISOString(),
  }
  await store.save(updated)
  return updated
}
