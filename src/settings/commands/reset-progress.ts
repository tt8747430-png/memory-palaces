import { makeProgress, PROGRESS_ID } from '@/study'
import type { Progress, ProgressStore } from '@/study'

export async function resetProgress(
  store: ProgressStore,
  now: number = Date.now(),
): Promise<Progress> {
  const fresh = makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  return store.save(fresh)
}
