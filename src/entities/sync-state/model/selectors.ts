import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Checkpoint } from '@/shared/api'
import { DEFAULT_SYNC_STATE, type SyncState } from './types'
import type { SyncStateState } from './store'

export const selectSyncState = (state: SyncStateState): SyncState =>
  state.syncState ?? DEFAULT_SYNC_STATE

export const selectAutosync = (state: SyncStateState): boolean => selectSyncState(state).autosync

export const selectLastSyncedAt = (state: SyncStateState): string | null =>
  selectSyncState(state).lastSyncedAt

export const selectCloudChanged = (state: SyncStateState): boolean =>
  selectSyncState(state).cloudChanged

export const checkpointFor = (state: SyncState, table: SyncedTable): Checkpoint | null =>
  state.checkpoints[table] ?? null
