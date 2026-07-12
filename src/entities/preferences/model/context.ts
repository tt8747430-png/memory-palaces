import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { PreferencesState, PreferencesStore } from './store'

export const PreferencesStoreContext = createContext<PreferencesStore | null>(null)

function usePreferencesStoreContext(): PreferencesStore {
  const store = useContext(PreferencesStoreContext)
  if (!store) {
    throw new Error('Preferences store missing — render inside <PreferencesStoreContext value={…}>')
  }
  return store
}

export function usePreferencesStore<T>(selector: (state: PreferencesState) => T): T {
  return useStore(usePreferencesStoreContext(), selector)
}

export function usePreferencesStoreApi(): PreferencesStore {
  return usePreferencesStoreContext()
}

export function usePreferencesStoreApiOptional(): PreferencesStore | null {
  return useContext(PreferencesStoreContext)
}
