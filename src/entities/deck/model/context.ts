import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { DeckState, DeckStore } from './store'

export const DeckStoreContext = createContext<DeckStore | null>(null)

function useDeckStoreContext(): DeckStore {
  const store = useContext(DeckStoreContext)
  if (!store) {
    throw new Error('Deck store missing — render inside <DeckStoreContext value={…}>')
  }
  return store
}

export function useDeckStore<T>(selector: (state: DeckState) => T): T {
  return useStore(useDeckStoreContext(), selector)
}

export function useDeckStoreApi(): DeckStore {
  return useDeckStoreContext()
}
