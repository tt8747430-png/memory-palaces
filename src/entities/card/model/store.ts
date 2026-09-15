import type { StoreApi } from 'zustand/vanilla'
import {
  byOrderThenCreated,
  type CollectionState,
  createCollectionStore,
  type PendingChangePort,
} from '@/shared/lib'
import type { CardRepository } from '@/entities/card'
import type { Card } from './types'

export type CardState = CollectionState<'cards', Card>
export type CardStore = StoreApi<CardState>

export function createCardStore(repo: CardRepository, pending?: PendingChangePort): CardStore {
  return createCollectionStore('cards', repo, byOrderThenCreated, { pending })
}
