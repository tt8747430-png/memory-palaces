import type { Entity } from '@/shared/lib'

export interface Progress extends Entity {
  xp: number
  streakCount: number
  longestStreak: number
  lastTrainingDate: string | null
  streakFreezes: number
  bestQuizAccuracy: number
  trainingDays: string[]
  activeDayKey: string | null
  activeDayCount: number
}

export interface MakeProgressInput {
  id: string
  createdAt: string
  xp?: number
  streakCount?: number
  longestStreak?: number
  lastTrainingDate?: string | null
  streakFreezes?: number
  bestQuizAccuracy?: number
  trainingDays?: string[]
  activeDayKey?: string | null
  activeDayCount?: number
}

export function makeProgress(input: MakeProgressInput): Progress {
  const xp = input.xp ?? 0
  if (xp < 0) throw new Error('xp must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    xp,
    streakCount: input.streakCount ?? 0,
    longestStreak: input.longestStreak ?? 0,
    lastTrainingDate: input.lastTrainingDate ?? null,
    streakFreezes: input.streakFreezes ?? 0,
    bestQuizAccuracy: input.bestQuizAccuracy ?? 0,
    trainingDays: input.trainingDays ? [...input.trainingDays] : [],
    activeDayKey: input.activeDayKey ?? null,
    activeDayCount: input.activeDayCount ?? 0,
  }
}

/**
 * Repair a stored document on the way in. A `progress` document that arrives over replication was
 * written by whichever build the other device runs and is stored at the current version untouched,
 * so a field this build expects can simply be absent. The entity decides what that means, once,
 * here — not every screen reading it: `StreakPage`, `use-rewards` and `use-home-header-data` each
 * carried their own `?? 0` / `?? []`, and `mergeProgress` carried none, so a document missing
 * `trainingDays` threw inside the replication conflict handler.
 *
 * `makeProgress` already defaults every field, so completing one is re-making it and keeping the
 * timestamp it arrived with. Matches `completePreferences` and `completeProfile`.
 */
export function completeProgress(progress: Progress): Progress {
  return { ...makeProgress(progress), updatedAt: progress.updatedAt }
}
