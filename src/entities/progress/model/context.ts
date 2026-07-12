import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProgressState, ProgressStore } from './store'

export const ProgressStoreContext = createContext<ProgressStore | null>(null)

function useProgressStoreContext(): ProgressStore {
  const store = useContext(ProgressStoreContext)
  if (!store) {
    throw new Error('Progress store missing — render inside <ProgressStoreContext value={…}>')
  }
  return store
}

export function useProgressStore<T>(selector: (state: ProgressState) => T): T {
  return useStore(useProgressStoreContext(), selector)
}

export function useProgressStoreApi(): ProgressStore {
  return useProgressStoreContext()
}

export function useProgressStoreApiOptional(): ProgressStore | null {
  return useContext(ProgressStoreContext)
}
