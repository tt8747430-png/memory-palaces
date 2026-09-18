import { mergeFields, type MergeFieldsOptions } from './merge-fields'
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

function mergeDailyTally(local: DailyTally, remote: DailyTally): DailyTally {
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
 * Two copies of the learner's progress, with no record of what they started from: the higher of
 * every counter, so no device's study is dropped. Without a base a counter cannot be summed — the
 * max is the best that can be said.
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

const sumOfChanges = (mine: number, theirs: number, base: number): number =>
  base + (mine - base) + (theirs - base)

const union = (mine: string[], theirs: string[]): string[] =>
  [...new Set([...mine, ...theirs])].sort()

/**
 * Against the copy both devices last saw, XP and freezes are what each device earned on top of it,
 * added together: 100 XP seen, 110 here and 120 there is 130, not 120. The rest merge as above.
 * The daily tally is two fields that move together, so both are settled from one comparison.
 */
export function mergeProgressAgainst<T extends MergeableProgress>(mine: T, theirs: T, base: T): T {
  const tally = mergeDailyTally(mine, theirs)
  const rules: MergeFieldsOptions<MergeableProgress> = {
    both: {
      xp: sumOfChanges,
      streakFreezes: sumOfChanges,
      streakCount: Math.max,
      longestStreak: Math.max,
      bestQuizAccuracy: Math.max,
      trainingDays: union,
      lastTrainingDate: maxDate,
      activeDayKey: () => tally.activeDayKey,
      activeDayCount: () => tally.activeDayCount,
    },
  }
  // The rules touch only what MergeableProgress declares, so they hold for any T that extends it.
  return mergeFields(mine, theirs, base, rules as MergeFieldsOptions<T>)
}
