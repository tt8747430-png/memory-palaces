import type { StoreApi } from 'zustand/vanilla'
import {
  byNewestFirst,
  type CollectionState,
  createCollectionStore,
  type PendingChangePort,
} from '@/shared/lib'
import type { DeckRepository } from '@/entities/deck'
import { completeDeck, type Deck } from './types'

export type DeckState = CollectionState<'decks', Deck>
export type DeckStore = StoreApi<DeckState>

export function createDeckStore(repo: DeckRepository, pending?: PendingChangePort): DeckStore {
  return createCollectionStore('decks', repo, byNewestFirst, { pending, complete: completeDeck })
}
