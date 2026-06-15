import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { LocusState, LocusStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const LocusStoreContext = createContext<LocusStore | null>(null)

function useLocusStoreContext(): LocusStore {
  const store = useContext(LocusStoreContext)
  if (!store) {
    throw new Error('Locus store missing — render inside <LocusStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of locus state. */
export function useLocusStore<T>(selector: (state: LocusState) => T): T {
  return useStore(useLocusStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useLocusStoreApi(): LocusStore {
  return useLocusStoreContext()
}
