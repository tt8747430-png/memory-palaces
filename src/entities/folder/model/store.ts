import type { StoreApi } from 'zustand/vanilla'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import type { FolderRepository } from '@/entities/folder'
import type { Folder } from './types'

export type FolderState = CollectionState<'folders', Folder>
export type FolderStore = StoreApi<FolderState>

const byOldestFirst = (a: Folder, b: Folder): number => a.createdAt.localeCompare(b.createdAt)

export function createFolderStore(repo: FolderRepository): FolderStore {
  return createCollectionStore('folders', repo, byOldestFirst)
}
