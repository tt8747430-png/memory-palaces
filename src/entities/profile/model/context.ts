import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProfileState, ProfileStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const ProfileStoreContext = createContext<ProfileStore | null>(null)

function useProfileStoreContext(): ProfileStore {
  const store = useContext(ProfileStoreContext)
  if (!store) {
    throw new Error('Profile store missing — render inside <ProfileStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of profile state. */
export function useProfileStore<T>(selector: (state: ProfileState) => T): T {
  return useStore(useProfileStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useProfileStoreApi(): ProfileStore {
  return useProfileStoreContext()
}
