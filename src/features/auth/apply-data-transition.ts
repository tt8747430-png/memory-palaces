import type { DataTransition } from '@/shared/lib'
import type { SyncManager } from '@/shared/api/supabase'

export interface ApplyDataTransitionDeps {
  transition: DataTransition
  userId: string
  syncManager: Pick<SyncManager, 'start' | 'stop' | 'flush'>
  /** Wipes the on-device database — only ever called when a *different* account signs in. */
  resetLocal: () => Promise<void>
  /** Told when the outgoing account still had writes that never reached the server. */
  onUnsyncedLoss?: () => void
}

/**
 * Brings the local database in line with whoever just signed in, then starts replication.
 *
 * Claiming a guest's data needs no copying: the documents are already on the device, and the first
 * push stamps them with the new account's id. Only a switch between two different accounts wipes
 * anything — and then the outgoing account's work is pushed first, because a wipe would otherwise
 * throw away everything it wrote while offline. If that push cannot complete the wipe still has to
 * happen, since leaving one account's decks on the device would sync them into the other, so the
 * caller is told rather than left to guess.
 */
export async function applyDataTransition({
  transition,
  userId,
  syncManager,
  resetLocal,
  onUnsyncedLoss,
}: ApplyDataTransitionDeps): Promise<void> {
  if (transition === 'reset') {
    try {
      await syncManager.flush()
    } catch {
      onUnsyncedLoss?.()
    }
    await syncManager.stop()
    await resetLocal()
    return
  }
  await syncManager.start(userId)
}
