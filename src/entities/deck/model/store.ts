import type { StoreApi } from 'zustand/vanilla'
import { byNewestFirst, type CollectionState, createCollectionStore } from '@/shared/lib'
import type { DeckRepository } from '@/entities/deck'
import type { Deck } from './types'

export type DeckState = CollectionState<'decks', Deck>
export type DeckStore = StoreApi<DeckState>

export function createDeckStore(repo: DeckRepository): DeckStore {
  return createCollectionStore('decks', repo, byNewestFirst)
}
