import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { FolderRepository } from '@/entities/folder'
import type { Folder } from './types'

export type FolderStatus = 'idle' | 'loading' | 'ready'

export interface FolderState {
  folders: Folder[]
  status: FolderStatus
  start: () => void
  stop: () => void
  save: (folder: Folder) => Promise<Folder>
  remove: (id: string) => Promise<void>
}

export type FolderStore = StoreApi<FolderState>

const byOldestFirst = (a: Folder, b: Folder): number => a.createdAt.localeCompare(b.createdAt)

export function createFolderStore(repo: FolderRepository): FolderStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<FolderState>((set) => ({
    folders: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((folders) => {
        set({ folders: [...folders].sort(byOldestFirst), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(folder) {
      return repo.save(folder)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
