import type { Entity } from '@app/shared/domain'

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
