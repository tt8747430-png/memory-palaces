import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { DeckRepository } from '@/entities/deck'
import type { Deck } from './types'

export type DeckStatus = 'idle' | 'loading' | 'ready'

export interface DeckState {
  decks: Deck[]
  status: DeckStatus
  start: () => void
  stop: () => void
  save: (deck: Deck) => Promise<Deck>
  remove: (id: string) => Promise<void>
}

export type DeckStore = StoreApi<DeckState>

const byNewestFirst = (a: Deck, b: Deck): number => b.createdAt.localeCompare(a.createdAt)

export function createDeckStore(repo: DeckRepository): DeckStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<DeckState>((set) => ({
    decks: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((decks) => {
        set({ decks: [...decks].sort(byNewestFirst), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(deck) {
      return repo.save(deck)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
