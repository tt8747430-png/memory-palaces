import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProfileState, ProfileStore } from './store'

export const ProfileStoreContext = createContext<ProfileStore | null>(null)

function useProfileStoreContext(): ProfileStore {
  const store = useContext(ProfileStoreContext)
  if (!store) {
    throw new Error('Profile store missing — render inside <ProfileStoreContext value={…}>')
  }
  return store
}

export function useProfileStore<T>(selector: (state: ProfileState) => T): T {
  return useStore(useProfileStoreContext(), selector)
}

export function useProfileStoreApi(): ProfileStore {
  return useProfileStoreContext()
}
