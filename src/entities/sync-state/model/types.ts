import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Checkpoint } from '@/shared/api'

export const SYNC_STATE_ID = 'sync-state'

export type SyncLogOutcome = 'clean' | 'merged' | 'needs-review' | 'failed'

/** One Sync this device ran: when, how it ended, and how much moved. */
export interface SyncLogEntry {
  at: string
  outcome: SyncLogOutcome
  pushed: number
  pulled: number
  reason?: string
}

/** How many Syncs the device remembers — enough to answer "did it sync?", not a history. */
export const SYNC_LOG_LIMIT = 10

export interface SyncState {
  id: typeof SYNC_STATE_ID
  checkpoints: Partial<Record<SyncedTable, Checkpoint | null>>
  lastSyncedAt: string | null
  cloudChanged: boolean
  /** Newest first, capped at `SYNC_LOG_LIMIT`. */
  log: SyncLogEntry[]
}

export const DEFAULT_SYNC_STATE: SyncState = {
  id: SYNC_STATE_ID,
  checkpoints: {},
  lastSyncedAt: null,
  cloudChanged: false,
  log: [],
}

export function completeSyncState(state: SyncState): SyncState {
  return {
    ...DEFAULT_SYNC_STATE,
    ...state,
    id: SYNC_STATE_ID,
    checkpoints: state.checkpoints ?? {},
    log: state.log ?? [],
  }
}

export function appendSyncLog(log: readonly SyncLogEntry[], entry: SyncLogEntry): SyncLogEntry[] {
  return [entry, ...log].slice(0, SYNC_LOG_LIMIT)
}
