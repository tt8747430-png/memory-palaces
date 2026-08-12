import { type Clocked, newest } from './newest'
import type { DailyTally } from './streak'

/**
 * The shape a merge needs, not the entity — `shared` sits below `entities`, and structural typing
 * keeps `Progress` assignable without the upward import.
 */
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

/**
 * The day tally is a pair, not a counter: `activeDayCount` means nothing without the `activeDayKey`
 * it was counted for, and it restarts when the day rolls over. Same day on both devices — each
 * studied cards the other never saw, so the higher count is the truer one. Different days — the
 * later day's own count, never the stale day's larger number, which would hand today's goal ring a
 * total that was never studied today.
 */
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

/**
 * Field-aware merge for two devices that both studied offline. Lifetime counters only ever go up,
 * so the max is the true value; training days are a set; the day tally travels as a pair; everything
 * else follows the newest write. Whole-document last-write-wins would silently throw away a day of
 * study on the losing device.
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
    ...mergeDailyTally(local, remote),
  }
}
