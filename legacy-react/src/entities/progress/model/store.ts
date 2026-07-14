import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { ProgressRepository } from '@/entities/progress'
import type { Progress } from './types'

export type ProgressStatus = 'idle' | 'loading' | 'ready'

export interface ProgressState {
  progress: Progress | null
  status: ProgressStatus
  start: () => void
  stop: () => void
  save: (progress: Progress) => Promise<Progress>
}

export type ProgressStore = StoreApi<ProgressState>

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
