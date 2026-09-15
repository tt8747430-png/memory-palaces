import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Checkpoint } from '@/shared/api'

export const SYNC_STATE_ID = 'sync-state'

/**
 * This device's own bookkeeping about the cloud. A singleton, and deliberately device-local: it is
 * not in `SYNCED_TABLES`, because a device's idea of where it has got to is not a fact about the
 * account.
 *
 * **Autosync lives here rather than on `preferences`** for exactly that reason. `preferences` is
 * synced, so storing it there would turn Autosync on for every device at once the moment one device
 * enabled it — silently voiding "sync is manual", which is the whole decision. `preferencesSchema`
 * is not touched by this work.
 */
export interface SyncState {
  id: typeof SYNC_STATE_ID
  /**
   * Where the last completed Sync's peek got to, per table. Ours, not RxDB's: RxDB owns the
   * checkpoint that decides what is *applied*, and this one only decides what the user is *asked
   * about*. They are allowed to drift — a stale one over-reports divergence, which is the safe
   * direction, and a completed Sync resets it.
   *
   * A missing key reads as "cloud position unknown", which the next Sync resolves by peeking from
   * the epoch. Keys are not required, so adding a table to `SYNCED_TABLES` needs no migration.
   */
  checkpoints: Partial<Record<SyncedTable, Checkpoint | null>>
  lastSyncedAt: string | null
  /** False on a new device. The risk is named and accepted; the banner is the mitigation. */
  autosync: boolean
  /** Raised by the cloud watcher when somebody else's device wrote. Lowered by a completed Sync. */
  cloudChanged: boolean
}

export const DEFAULT_SYNC_STATE: SyncState = {
  id: SYNC_STATE_ID,
  checkpoints: {},
  lastSyncedAt: null,
  autosync: false,
  cloudChanged: false,
}

/**
 * Fills fields a stored document predates, on the way in. Same reason `completePreferences`
 * exists: a schema migration only repairs what is already on this device.
 */
export function completeSyncState(state: SyncState): SyncState {
  return {
    ...DEFAULT_SYNC_STATE,
    ...state,
    id: SYNC_STATE_ID,
    checkpoints: state.checkpoints ?? {},
  }
}
