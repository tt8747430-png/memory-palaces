import { isAfterCheckpoint, type RemoteChangeEvent } from '@/shared/api'
import { checkpointFor, selectSyncState } from '@/entities/sync-state'
import type { SyncDeps } from './sync-deps'

/**
 * What the cloud watcher's events do: raise the banner's "the cloud has moved" flag, and nothing
 * else. No document is applied — that is a Sync's job, and only when the user asks.
 *
 * The event is ignored unless it is genuinely *past* this device's checkpoint. Realtime echoes this
 * device's own push back to it, and those rows sit at or below the checkpoint the Sync that pushed
 * them wrote — so without this comparison the banner would light up after every successful Sync and
 * mean nothing.
 */
export async function noteCloudChange(
  deps: Pick<SyncDeps, 'syncStateStore'>,
  event: RemoteChangeEvent,
): Promise<void> {
  const state = selectSyncState(deps.syncStateStore.getState())
  if (!isAfterCheckpoint(event, checkpointFor(state, event.table))) return
  if (state.cloudChanged) return
  await deps.syncStateStore.getState().save({ ...state, cloudChanged: true })
}
