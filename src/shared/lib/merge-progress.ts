import { type Clocked, newest } from './newest'
import type { DailyTally } from './streak'

export interface MergeableProgress extends Clocked, DailyTally {
  xp: number
  streakCount: number
  longestStreak: number
  lastTrainingDate: string | null
  streakFreezes: number
  bestQuizAccuracy: number
  trainingDays: string[]
}

const maxDate = (a: string | null, b: string | null): string | null => {
  if (!a) return b
  if (!b) return a
  return a >= b ? a : b
}

function mergeDailyTally(local: MergeableProgress, remote: MergeableProgress): DailyTally {
  if (local.activeDayKey === remote.activeDayKey) {
    return {
      activeDayKey: local.activeDayKey,
      activeDayCount: Math.max(local.activeDayCount, remote.activeDayCount),
    }
  }
  const later =
    maxDate(local.activeDayKey, remote.activeDayKey) === local.activeDayKey ? local : remote
  return { activeDayKey: later.activeDayKey, activeDayCount: later.activeDayCount }
}

export function mergeProgress<T extends MergeableProgress>(local: T, remote: T): T {
  return {
    ...newest(local, remote),
    xp: Math.max(local.xp, remote.xp),
    streakCount: Math.max(local.streakCount, remote.streakCount),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    streakFreezes: Math.max(local.streakFreezes, remote.streakFreezes),
    bestQuizAccuracy: Math.max(local.bestQuizAccuracy, remote.bestQuizAccuracy),
    trainingDays: [...new Set([...local.trainingDays, ...remote.trainingDays])].sort(),
    lastTrainingDate: maxDate(local.lastTrainingDate, remote.lastTrainingDate),
    ...mergeDailyTally(local, remote),
  }
}
