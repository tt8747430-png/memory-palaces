import { levelFromXp, recordPractice } from '@/shared/lib'
import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

export interface CompleteSessionOptions {
  xp: number
  itemsPracticed: number
  dailyGoal: number
  quizAccuracy?: number
}

export interface SessionReward {
  xpGained: number
  leveledUp: boolean
  level: number
  streakCount: number
  isMilestone: boolean
  dayBecameActive: boolean
  dayCount: number
  dailyGoal: number
  isBestQuiz: boolean
  quizAccuracy?: number
}

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
