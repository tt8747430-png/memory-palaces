import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type SingletonState } from '@/shared/lib'
import type { SyncStateRepository } from '@/entities/sync-state'
import { completeSyncState, type SyncState } from './types'

export type SyncStateState = SingletonState<'syncState', SyncState>
export type SyncStateStore = StoreApi<SyncStateState>

export function createSyncStateStore(repo: SyncStateRepository): SyncStateStore {
  return createSingletonStore('syncState', repo, completeSyncState)
}
