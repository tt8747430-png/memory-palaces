import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { CardState, CardStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const CardStoreContext = createContext<CardStore | null>(null)

function useCardStoreContext(): CardStore {
  const store = useContext(CardStoreContext)
  if (!store) {
    throw new Error('Card store missing — render inside <CardStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of card state. */
export function useCardStore<T>(selector: (state: CardState) => T): T {
  return useStore(useCardStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useCardStoreApi(): CardStore {
  return useCardStoreContext()
}
