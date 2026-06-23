import type { Entity } from '@/shared/lib'

/**
 * The learner's single progress record. Holds only source-of-truth values; the
 * level, overall percentage, and room counts are derived in `shared/lib/stats`.
 * Its streak fields satisfy `StreakState` structurally, so `recordTrainingDay`
 * operates on it directly.
 */
export interface Progress extends Entity {
  xp: number
  streakCount: number
  longestStreak: number
  lastTrainingDate: string | null
  streakFreezes: number
  /** Highest quiz accuracy ever achieved (0–100). */
  bestQuizAccuracy: number
  trainingDays: string[]
  /** UTC day key the running practice tally belongs to; null before any practice. */
  activeDayKey: string | null
  /** Items practised during `activeDayKey` (resets when the day rolls over). */
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
