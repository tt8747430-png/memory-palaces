import type { StoreApi } from 'zustand/vanilla'
import {
  byNewestFirst,
  type CollectionState,
  createCollectionStore,
  type PendingChangePort,
} from '@/shared/lib'
import type { HistoryRepository } from '@/entities/learning-history'
import type { HistoryEntry } from './types'

export type HistoryState = CollectionState<'history', HistoryEntry>
export type HistoryStore = StoreApi<HistoryState>

export function createHistoryStore(
  repo: HistoryRepository,
  pending?: PendingChangePort,
): HistoryStore {
  return createCollectionStore('history', repo, byNewestFirst, { pending })
}
