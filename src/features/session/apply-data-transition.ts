import type { DataOwner, DataTransition } from '@/shared/lib'
import type { RemoteChangeEvent } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'

export interface ApplyDataTransitionDeps {
  transition: DataTransition
  userId: string
  syncManager: Pick<SyncManager, 'start' | 'stop'>
  /** Handed straight to the cloud watcher the manager opens for this account. */
  onRemoteChange?: (event: RemoteChangeEvent) => void
  /** Records that the data on this device now belongs to `userId`. */
  dataOwner: DataOwner
  /** Wipes the on-device database — only ever called when a *different* account signs in. */
  resetLocal: () => Promise<void>
}

/**
 * Brings the local database in line with whoever just signed in, then starts watching the cloud.
 *
 * Claiming a guest's data needs no copying: the documents are already on the device, and the first
 * Sync stamps them with the new account's id. Only a switch between two different accounts wipes
 * anything, because leaving one account's decks on the device would sync them into the other.
 *
 * There is no "push the outgoing account's work first" here, and there cannot be: the outgoing
 * account's session is already gone, and a push now would carry its decks into the incoming
 * account. Whether unsynced work may be erased is asked *before* this runs — see
 * `useDataTransition`, which offers to sign out instead so the previous account can synchronise.
 *
 * Either way the new owner is recorded before anything else can interrupt — the wipe reloads the
 * page, and coming back still owned by the previous account would wipe the incoming one's data too.
 */
export async function applyDataTransition({
  transition,
  userId,
  syncManager,
  dataOwner,
  resetLocal,
  onRemoteChange,
}: ApplyDataTransitionDeps): Promise<void> {
  if (transition === 'reset') {
    await syncManager.stop()
    dataOwner.claim(userId)
    await resetLocal()
    return
  }
  dataOwner.claim(userId)
  await syncManager.start(userId, onRemoteChange)
}
