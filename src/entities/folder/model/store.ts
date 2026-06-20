import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { FolderRepository } from '../api/folder-repository'
import type { Folder } from './types'

export type FolderStatus = 'idle' | 'loading' | 'ready'

export interface FolderState {
  folders: Folder[]
  status: FolderStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `folders` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (folder: Folder) => Promise<Folder>
  remove: (id: string) => Promise<void>
}

export type FolderStore = StoreApi<FolderState>

// Oldest-first so the collection rail keeps a stable order as new folders are added
// to the end, rather than reshuffling the chips the user just learned.
const byOldestFirst = (a: Folder, b: Folder): number => a.createdAt.localeCompare(b.createdAt)

/**
 * Store FACTORY (repository INJECTED — Dependency Inversion). Mirrors the palace store:
 * the list is RxDB-reactive, so `start()` subscribes once and saves/removes flow into
 * `folders` without a manual reload. Mutations persist only through the port.
 */
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
