import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

/** Command — add XP to the learner's progress (creating the record on first use).
 * Non-positive amounts are ignored. The single write-path for XP (study/quiz/match/
 * verse completions, and later the AI Tutor). `now` is injected for determinism. */
export async function awardXp(
  store: ProgressStore,
  amount: number,
  now: number = Date.now(),
): Promise<Progress> {
  const base = currentProgress(store, now)
  const gained = Math.max(0, Math.round(amount))
  const updated: Progress = { ...base, xp: base.xp + gained, updatedAt: new Date(now).toISOString() }
  await store.getState().save(updated)
  return updated
}
