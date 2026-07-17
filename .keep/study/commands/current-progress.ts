import { makeProgress } from '@app/study/model/progress'
import type { Progress } from '@app/study/model/progress'
import type { ProgressStore } from '@app/study/data/progress-store'

export const PROGRESS_ID = 'progress'

export function currentProgress(store: ProgressStore, now: number): Progress {
  return (
    store.progress() ?? makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  )
}
