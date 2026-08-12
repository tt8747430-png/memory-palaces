import type { DataTransition } from '@/shared/lib'
import type { SyncManager } from '@/shared/api/supabase'

export interface ClaimGuestDataDeps {
  transition: DataTransition
  userId: string
  syncManager: Pick<SyncManager, 'start' | 'stop'>
  /** Wipes the on-device database — only ever called when a *different* account signs in. */
  resetLocal: () => Promise<void>
}

/**
 * Brings the local database in line with whoever just signed in, then starts replication.
 *
 * Claiming guest data needs no copying: the documents are already on the device, and the first push
 * stamps them with the new account's id. Only a switch between two different accounts wipes
 * anything, and then the pull rehydrates from the server.
 */
export async function claimGuestData({
  transition,
  userId,
  syncManager,
  resetLocal,
}: ClaimGuestDataDeps): Promise<void> {
  if (transition === 'reset') {
    await syncManager.stop()
    await resetLocal()
    return
  }
  await syncManager.start(userId)
}
