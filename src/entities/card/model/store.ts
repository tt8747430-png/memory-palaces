import type { StoreApi } from 'zustand/vanilla'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import type { CardRepository } from '@/entities/card'
import type { Card } from './types'

export type CardState = CollectionState<'cards', Card>
export type CardStore = StoreApi<CardState>

const byOrder = (a: Card, b: Card): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export function createCardStore(repo: CardRepository): CardStore {
  return createCollectionStore('cards', repo, byOrder)
}
