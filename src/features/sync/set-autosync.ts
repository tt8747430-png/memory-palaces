import { selectSyncState } from '@/entities/sync-state'
import type { SyncDeps } from './sync-deps'

/**
 * Turns Autosync on or off for **this device**. Never for the account: `syncState` is not in
 * `SYNCED_TABLES`, so one device's choice cannot quietly enable it everywhere.
 */
export async function setAutosync(
  deps: Pick<SyncDeps, 'syncStateStore'>,
  autosync: boolean,
): Promise<void> {
  const state = selectSyncState(deps.syncStateStore.getState())
  if (state.autosync === autosync) return
  await deps.syncStateStore.getState().save({ ...state, autosync })
}
