import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { FolderState, FolderStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const FolderStoreContext = createContext<FolderStore | null>(null)

function useFolderStoreContext(): FolderStore {
  const store = useContext(FolderStoreContext)
  if (!store) {
    throw new Error('Folder store missing — render inside <FolderStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of folder state. */
export function useFolderStore<T>(selector: (state: FolderState) => T): T {
  return useStore(useFolderStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useFolderStoreApi(): FolderStore {
  return useFolderStoreContext()
}
