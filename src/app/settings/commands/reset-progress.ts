import { makeProgress } from '@app/study/model/progress'
import type { Progress } from '@app/study/model/progress'
import type { ProgressStore } from '@app/study/data/progress-store'
import { PROGRESS_ID } from '@app/study/commands/progress-index'

export async function resetProgress(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<Progress> {
  const fresh = makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  return store.save(fresh)
}
