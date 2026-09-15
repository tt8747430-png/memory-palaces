import type { StoreApi } from 'zustand/vanilla'
import { byNewestFirst, type CollectionState, createCollectionStore } from '@/shared/lib'
import type { HistoryRepository } from '@/entities/learning-history'
import type { HistoryEntry } from './types'

export type HistoryState = CollectionState<'history', HistoryEntry>
export type HistoryStore = StoreApi<HistoryState>

/** Newest first: a history is read from the last answer backwards. */
export function createHistoryStore(repo: HistoryRepository): HistoryStore {
  return createCollectionStore('history', repo, byNewestFirst)
}
