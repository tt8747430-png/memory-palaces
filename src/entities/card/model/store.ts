import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { CardRepository } from '@/entities/card'
import type { Card } from './types'

export type CardStatus = 'idle' | 'loading' | 'ready'

export interface CardState {
  cards: Card[]
  status: CardStatus
  start: () => void
  stop: () => void
  save: (card: Card) => Promise<Card>
  remove: (id: string) => Promise<void>
}

export type CardStore = StoreApi<CardState>

const byOrder = (a: Card, b: Card): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export function createCardStore(repo: CardRepository): CardStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<CardState>((set) => ({
    cards: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((cards) => {
        set({ cards: [...cards].sort(byOrder), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(card) {
      return repo.save(card)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
