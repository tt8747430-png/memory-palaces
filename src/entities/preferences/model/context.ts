import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { PreferencesState, PreferencesStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const PreferencesStoreContext = createContext<PreferencesStore | null>(null)

function usePreferencesStoreContext(): PreferencesStore {
  const store = useContext(PreferencesStoreContext)
  if (!store) {
    throw new Error('Preferences store missing — render inside <PreferencesStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of preferences state. */
export function usePreferencesStore<T>(selector: (state: PreferencesState) => T): T {
  return useStore(usePreferencesStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function usePreferencesStoreApi(): PreferencesStore {
  return usePreferencesStoreContext()
}

/** Imperative handle, or null when no store is provided — lets cross-cutting code
 * (e.g. reward-toast gating) read preferences without forcing the context. */
export function usePreferencesStoreApiOptional(): PreferencesStore | null {
  return useContext(PreferencesStoreContext)
}
