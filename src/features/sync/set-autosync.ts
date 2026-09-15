import { selectSyncState } from '@/entities/sync-state'
import type { SyncDeps } from './sync-deps'

export async function setAutosync(
  deps: Pick<SyncDeps, 'syncStateStore'>,
  autosync: boolean,
): Promise<void> {
  const state = selectSyncState(deps.syncStateStore.getState())
  if (state.autosync === autosync) return
  await deps.syncStateStore.getState().save({ ...state, autosync })
}
