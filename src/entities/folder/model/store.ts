import type { StoreApi } from 'zustand/vanilla'
import {
  byOldestFirst,
  type CollectionState,
  createCollectionStore,
  type PendingChangePort,
} from '@/shared/lib'
import type { FolderRepository } from '@/entities/folder'
import type { Folder } from './types'

export type FolderState = CollectionState<'folders', Folder>
export type FolderStore = StoreApi<FolderState>

/** `pending` is what records a write the cloud has not confirmed; absent, the store syncs nothing. */
export function createFolderStore(
  repo: FolderRepository,
  pending?: PendingChangePort,
): FolderStore {
  return createCollectionStore('folders', repo, byOldestFirst, { pending })
}
