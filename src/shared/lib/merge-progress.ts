import { type Clocked, newest } from './newest'

/**
 * The shape a merge needs, not the entity — `shared` sits below `entities`, and structural typing
 * keeps `Progress` assignable without the upward import.
 */
export interface MergeableProgress extends Clocked {
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

/**
 * Field-aware merge for two devices that both studied offline. Lifetime counters only ever go up,
 * so the max is the true value; training days are a set; everything else follows the newest write.
 * Whole-document last-write-wins would silently throw away a day of study on the losing device.
 */
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
  }
}
