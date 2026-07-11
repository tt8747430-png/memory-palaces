import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { DeckState, DeckStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const DeckStoreContext = createContext<DeckStore | null>(null)

function useDeckStoreContext(): DeckStore {
  const store = useContext(DeckStoreContext)
  if (!store) {
    throw new Error('Deck store missing — render inside <DeckStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of deck state. */
export function useDeckStore<T>(selector: (state: DeckState) => T): T {
  return useStore(useDeckStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useDeckStoreApi(): DeckStore {
  return useDeckStoreContext()
}
