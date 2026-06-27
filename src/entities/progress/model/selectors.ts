import { levelFromXp, type LevelInfo, totalTrainingDays } from '@/shared/lib'
import type { Progress } from './types'
import type { ProgressState } from './store'

export const selectProgress = (state: ProgressState): Progress | null => state.progress
export const selectIsReady = (state: ProgressState): boolean => state.status === 'ready'

/** Derived level info from the record's XP (never stored — computed in `shared/lib`). */
export const progressLevel = (progress: Progress | null): LevelInfo =>
  levelFromXp(progress?.xp ?? 0)

/** Distinct days trained, for the streak/stats surfaces. */
export const progressTrainingDays = (progress: Progress | null): number =>
  totalTrainingDays(progress?.trainingDays ?? [])
