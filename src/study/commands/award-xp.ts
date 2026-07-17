import type { Progress } from '@/study/model/progress'
import type { ProgressStore } from '@/study/data/progress-store'
import { currentProgress } from './current-progress'

export async function awardXp(
  store: ProgressStore,
  amount: number,
  now: number = Date.now(),
): Promise<Progress> {
  const base = currentProgress(store, now)
  const gained = Math.max(0, Math.round(amount))
  const updated: Progress = {
    ...base,
    xp: base.xp + gained,
    updatedAt: new Date(now).toISOString(),
  }
  await store.save(updated)
  return updated
}
