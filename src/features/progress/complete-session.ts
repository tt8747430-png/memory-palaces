import { levelFromXp, recordPractice } from '@/shared/lib'
import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

export interface CompleteSessionOptions {
  /** XP earned this session (already computed via the reward helpers). */
  xp: number
  /** Items practised this session, counted toward the daily goal. */
  itemsPracticed: number
  /** The learner's daily goal (items to make the day active). */
  dailyGoal: number
  /** When set, also record the session's quiz accuracy (best-of). */
  quizAccuracy?: number
}

export interface SessionReward {
  xpGained: number
  leveledUp: boolean
  level: number
  streakCount: number
  isMilestone: boolean
  /** True only when this session pushed today's tally to the goal (day just became active). */
  dayBecameActive: boolean
  /** Items practised today after this session. */
  dayCount: number
  /** The daily goal in force. */
  dailyGoal: number
  /** A quiz this session set a new personal-best accuracy. */
  isBestQuiz: boolean
  /** The session's quiz accuracy (rounded), when one was played. */
  quizAccuracy?: number
}

/**
 * Facade — apply everything a finished session earns in a SINGLE read-modify-write:
 * XP, the practice tally / active-day streak, and (optionally) the best quiz accuracy.
 * XP is always awarded; the streak advances only when the day's tally reaches the goal.
 * One `save` matters because persistence is async (RxDB) — chaining per-field commands
 * would read stale state between awaits and lose updates.
 */
export async function completeSession(
  store: ProgressStore,
  options: CompleteSessionOptions,
  now: number = Date.now(),
): Promise<SessionReward> {
  const base = currentProgress(store, now)
  const beforeLevel = levelFromXp(base.xp).level
  const gained = Math.max(0, Math.round(options.xp))

  const practice = recordPractice(base, options.itemsPracticed, options.dailyGoal, now)

  let next: Progress = {
    ...base,
    ...practice.state,
    xp: base.xp + gained,
    updatedAt: new Date(now).toISOString(),
  }

  const quizAccuracy =
    options.quizAccuracy === undefined ? undefined : Math.round(options.quizAccuracy)
  const isBestQuiz = quizAccuracy !== undefined && quizAccuracy > base.bestQuizAccuracy
  if (quizAccuracy !== undefined) {
    next = { ...next, bestQuizAccuracy: Math.max(next.bestQuizAccuracy, quizAccuracy) }
  }

  await store.getState().save(next)

  const level = levelFromXp(next.xp).level
  return {
    xpGained: gained,
    leveledUp: level > beforeLevel,
    level,
    streakCount: practice.streak.streakCount,
    isMilestone: practice.result?.isMilestone ?? false,
    dayBecameActive: practice.becameActive,
    dayCount: practice.dayCount,
    dailyGoal: practice.dailyGoal,
    isBestQuiz,
    quizAccuracy,
  }
}
