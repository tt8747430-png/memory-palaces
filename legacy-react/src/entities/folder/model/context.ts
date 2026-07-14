import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { FolderState, FolderStore } from './store'

export const FolderStoreContext = createContext<FolderStore | null>(null)

function useFolderStoreContext(): FolderStore {
  const store = useContext(FolderStoreContext)
  if (!store) {
    throw new Error('Folder store missing — render inside <FolderStoreContext value={…}>')
  }
  return store
}

export function useFolderStore<T>(selector: (state: FolderState) => T): T {
  return useStore(useFolderStoreContext(), selector)
}

export function useFolderStoreApi(): FolderStore {
  return useFolderStoreContext()
}
