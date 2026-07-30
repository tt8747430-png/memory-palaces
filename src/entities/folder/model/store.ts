import type { StoreApi } from 'zustand/vanilla'
import { byOldestFirst, type CollectionState, createCollectionStore } from '@/shared/lib'
import type { FolderRepository } from '@/entities/folder'
import type { Folder } from './types'

export type FolderState = CollectionState<'folders', Folder>
export type FolderStore = StoreApi<FolderState>

export function createFolderStore(repo: FolderRepository): FolderStore {
  return createCollectionStore('folders', repo, byOldestFirst)
}
