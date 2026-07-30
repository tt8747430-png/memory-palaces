import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type SingletonState } from '@/shared/lib'
import type { ProgressRepository } from '@/entities/progress'
import type { Progress } from './types'

export type ProgressState = SingletonState<'progress', Progress>
export type ProgressStore = StoreApi<ProgressState>

export function createProgressStore(repo: ProgressRepository): ProgressStore {
  return createSingletonStore('progress', repo)
}
