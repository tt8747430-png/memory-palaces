import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type PendingChangePort, type SingletonState } from '@/shared/lib'
import type { ProgressRepository } from '@/entities/progress'
import { completeProgress, type Progress } from './types'

export type ProgressState = SingletonState<'progress', Progress>
export type ProgressStore = StoreApi<ProgressState>

export function createProgressStore(repo: ProgressRepository, pending?: PendingChangePort): ProgressStore {
  return createSingletonStore('progress', repo, completeProgress, pending)
}
