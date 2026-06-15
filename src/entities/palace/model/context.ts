import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { PalaceState, PalaceStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const PalaceStoreContext = createContext<PalaceStore | null>(null)

function usePalaceStoreContext(): PalaceStore {
  const store = useContext(PalaceStoreContext)
  if (!store) {
    throw new Error('Palace store missing — render inside <PalaceStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of palace state. */
export function usePalaceStore<T>(selector: (state: PalaceState) => T): T {
  return useStore(usePalaceStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function usePalaceStoreApi(): PalaceStore {
  return usePalaceStoreContext()
}
