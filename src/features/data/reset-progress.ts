import { makeProgress, type Progress, type ProgressStore } from '@/entities/progress'
import { PROGRESS_ID } from '@/features/progress'

/** Command — wipe XP, streak, and training history back to a fresh zeroed record. */
export async function resetProgress(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<Progress> {
  const fresh = makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  return store.getState().save(fresh)
}
