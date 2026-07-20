import { makeProgress } from '../model/progress'
import type { Progress } from '../model/progress'
import type { ProgressStore } from '../data/progress-store'

export const PROGRESS_ID = 'progress'

export function currentProgress(store: ProgressStore, now: number): Progress {
  return (
    store.progress() ?? makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  )
}
