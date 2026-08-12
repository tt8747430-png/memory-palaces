import { createContext, useContext } from 'react'
import type { StoragePort } from '@/shared/api'

export const StoragePortContext = createContext<StoragePort | null>(null)

export function useStorage(): StoragePort {
  const storage = useContext(StoragePortContext)
  if (!storage) {
    throw new Error('Storage port missing — render inside <StoragePortContext value={…}>')
  }
  return storage
}
