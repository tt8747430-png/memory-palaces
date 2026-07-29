import { makeProgress, type Progress, type ProgressStore } from '@/entities/progress'
import { nowIso } from '@/shared/lib'

export const PROGRESS_ID = 'progress'

export function currentProgress(store: ProgressStore, now: number): Progress {
  return store.getState().progress ?? makeProgress({ id: PROGRESS_ID, createdAt: nowIso(now) })
}
