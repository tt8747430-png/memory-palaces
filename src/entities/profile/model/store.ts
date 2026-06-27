import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { ProfileRepository } from '@/entities/profile'
import type { Profile } from './types'

export type ProfileStatus = 'idle' | 'loading' | 'ready'

export interface ProfileState {
  /** The single profile record, or null until one is created. */
  profile: Profile | null
  status: ProfileStatus
  start: () => void
  stop: () => void
  save: (profile: Profile) => Promise<Profile>
}

export type ProfileStore = StoreApi<ProfileState>

/** Store FACTORY (repository INJECTED), reactive single-doc like the preferences store. */
export function createProfileStore(repo: ProfileRepository): ProfileStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<ProfileState>((set) => ({
    profile: null,
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((all) => {
        set({ profile: all[0] ?? null, status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(profile) {
      return repo.save(profile)
    },
  }))
}
