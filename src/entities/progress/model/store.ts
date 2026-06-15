import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { ProgressRepository } from '../api/progress-repository'
import type { Progress } from './types'

export type ProgressStatus = 'idle' | 'loading' | 'ready'

export interface ProgressState {
  /** The single progress record, or null until one is created. */
  progress: Progress | null
  status: ProgressStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `progress` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (progress: Progress) => Promise<Progress>
}

export type ProgressStore = StoreApi<ProgressState>

/** Store FACTORY (repository INJECTED), reactive like the entity stores. Progress is
 * a singleton record, so the store tracks the first (only) document. */
export function createProgressStore(repo: ProgressRepository): ProgressStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<ProgressState>((set) => ({
    progress: null,
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((all) => {
        set({ progress: all[0] ?? null, status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(progress) {
      return repo.save(progress)
    },
  }))
}
