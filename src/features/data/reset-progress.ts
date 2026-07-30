import { makeProgress, type Progress, type ProgressStore } from '@/entities/progress'
import { PROGRESS_ID } from '@/features/progress'
import { nowIso } from '@/shared/lib'

export async function resetProgress(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<Progress> {
  const fresh = makeProgress({ id: PROGRESS_ID, createdAt: nowIso(now) })
  return store.getState().save(fresh)
}
