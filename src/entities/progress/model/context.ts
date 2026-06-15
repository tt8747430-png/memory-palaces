import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProgressState, ProgressStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const ProgressStoreContext = createContext<ProgressStore | null>(null)

function useProgressStoreContext(): ProgressStore {
  const store = useContext(ProgressStoreContext)
  if (!store) {
    throw new Error('Progress store missing — render inside <ProgressStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of progress state. */
export function useProgressStore<T>(selector: (state: ProgressState) => T): T {
  return useStore(useProgressStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useProgressStoreApi(): ProgressStore {
  return useProgressStoreContext()
}

/** Imperative handle, or null when no store is provided. Lets reward-on-completion
 * degrade gracefully in contexts that don't track progress (e.g. focused tests). */
export function useProgressStoreApiOptional(): ProgressStore | null {
  return useContext(ProgressStoreContext)
}
