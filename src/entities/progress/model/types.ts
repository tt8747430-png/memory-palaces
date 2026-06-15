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
  }
}
