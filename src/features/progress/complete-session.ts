import { levelFromXp, recordTrainingDay as advanceStreak } from '@/shared/lib'
import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

export interface CompleteSessionOptions {
  /** XP earned this session (already computed via the reward helpers). */
  xp: number
  /** Count today as a training day (advances the streak). Default true. */
  recordDay?: boolean
  /** When set, also record the session's quiz accuracy (best-of). */
  quizAccuracy?: number
}

export interface SessionReward {
  xpGained: number
  leveledUp: boolean
  level: number
  streakCount: number
  isMilestone: boolean
  alreadyTrainedToday: boolean
}

/**
 * Facade — apply everything a finished session earns in a SINGLE read-modify-write:
 * XP, the training day/streak, and (optionally) the best quiz accuracy. One `save`
 * matters because persistence is async (RxDB) — chaining the per-field commands
 * would read stale state between awaits and lose updates. Returns what to celebrate;
 * the UI decides how (toasts). The single completion write-path (UI now, Tutor later).
 */
export async function completeSession(
  store: ProgressStore,
  options: CompleteSessionOptions,
  now: number = Date.now(),
): Promise<SessionReward> {
  const base = currentProgress(store, now)
  const beforeLevel = levelFromXp(base.xp).level
  const gained = Math.max(0, Math.round(options.xp))

  let next: Progress = { ...base, xp: base.xp + gained, updatedAt: new Date(now).toISOString() }
  let streakCount = base.streakCount
  let isMilestone = false
  let alreadyTrainedToday = true

  if (options.recordDay !== false) {
    const result = advanceStreak(next, now)
    alreadyTrainedToday = result.alreadyTrainedToday
    isMilestone = result.isMilestone
    streakCount = result.state.streakCount
    if (!result.alreadyTrainedToday) next = { ...next, ...result.state }
  }

  if (options.quizAccuracy !== undefined) {
    next = {
      ...next,
      bestQuizAccuracy: Math.max(next.bestQuizAccuracy, Math.round(options.quizAccuracy)),
    }
  }

  await store.getState().save(next)

  const level = levelFromXp(next.xp).level
  return { xpGained: gained, leveledUp: level > beforeLevel, level, streakCount, isMilestone, alreadyTrainedToday }
}
