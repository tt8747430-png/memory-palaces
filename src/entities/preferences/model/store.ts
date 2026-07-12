import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { PreferencesRepository } from '@/entities/preferences'
import type { Preferences } from './types'

export type PreferencesStatus = 'idle' | 'loading' | 'ready'

export interface PreferencesState {
  preferences: Preferences | null
  status: PreferencesStatus
  start: () => void
  stop: () => void
  save: (preferences: Preferences) => Promise<Preferences>
}

export type PreferencesStore = StoreApi<PreferencesState>

export function createPreferencesStore(repo: PreferencesRepository): PreferencesStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<PreferencesState>((set) => ({
    preferences: null,
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((all) => {
        set({ preferences: all[0] ?? null, status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(preferences) {
      return repo.save(preferences)
    },
  }))
}
