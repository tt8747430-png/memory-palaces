import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { CardState, CardStore } from './store'

export const CardStoreContext = createContext<CardStore | null>(null)

function useCardStoreContext(): CardStore {
  const store = useContext(CardStoreContext)
  if (!store) {
    throw new Error('Card store missing — render inside <CardStoreContext value={…}>')
  }
  return store
}

export function useCardStore<T>(selector: (state: CardState) => T): T {
  return useStore(useCardStoreContext(), selector)
}

export function useCardStoreApi(): CardStore {
  return useCardStoreContext()
}
