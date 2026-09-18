import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Checkpoint } from '@/shared/api'

export const SYNC_STATE_ID = 'sync-state'

export interface SyncState {
  id: typeof SYNC_STATE_ID
  checkpoints: Partial<Record<SyncedTable, Checkpoint | null>>
  lastSyncedAt: string | null
  cloudChanged: boolean
}

export const DEFAULT_SYNC_STATE: SyncState = {
  id: SYNC_STATE_ID,
  checkpoints: {},
  lastSyncedAt: null,
  cloudChanged: false,
}

export function completeSyncState(state: SyncState): SyncState {
  return {
    ...DEFAULT_SYNC_STATE,
    ...state,
    id: SYNC_STATE_ID,
    checkpoints: state.checkpoints ?? {},
  }
}
