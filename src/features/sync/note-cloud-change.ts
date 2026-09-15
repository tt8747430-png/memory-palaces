import { isAfterCheckpoint, type RemoteChangeEvent } from '@/shared/api'
import { checkpointFor, selectSyncState } from '@/entities/sync-state'
import type { SyncDeps } from './sync-deps'

export async function noteCloudChange(
  deps: Pick<SyncDeps, 'syncStateStore'>,
  event: RemoteChangeEvent,
): Promise<void> {
  const state = selectSyncState(deps.syncStateStore.getState())
  if (!isAfterCheckpoint(event, checkpointFor(state, event.table))) return
  if (state.cloudChanged) return
  await deps.syncStateStore.getState().save({ ...state, cloudChanged: true })
}
