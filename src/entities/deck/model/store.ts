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

/**
 * `pending` is what records a write the cloud has not confirmed; absent, the store syncs nothing.
 * `completeDeck` narrows a cover arriving by replication from a device that still stores public
 * URLs — the read-side twin of `deckMigrations` 4.
 */
export function createDeckStore(repo: DeckRepository, pending?: PendingChangePort): DeckStore {
  return createCollectionStore('decks', repo, byNewestFirst, { pending, complete: completeDeck })
}
