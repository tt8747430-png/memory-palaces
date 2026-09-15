import { errorMessage, type SyncOutcome } from '@/shared/lib'
import { type PendingChange, selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { advance, findDestructive, peekAll, peekedCount, stepOverOwnEcho } from './divergence'
import type { SyncDeps } from './sync-deps'

export interface SyncNowOptions {
  /**
   * The documents the person has already answered for in this Sync, by `contentKey`. Their answers
   * have been applied as writes, but the remote change that raised the question is still ahead of
   * the checkpoint — so without this the same question would come straight back. Anything new that
   * arrived meanwhile is still asked about.
   */
  answered?: ReadonlySet<string>
}

/**
 * Clears the log entries the completed push carried.
 *
 * By `at`, not by id: a write made *during* the cycle produces a new entry under the same id, and
 * dropping that one would lose a change the push never saw. Whatever the snapshot did not cover
 * stays pending, which is the direction that keeps the banner honest.
 */
async function clearConfirmed(deps: SyncDeps, snapshot: readonly PendingChange[]): Promise<void> {
  const current = new Map(
    selectPendingChanges(deps.pendingChangeStore.getState()).map((change) => [change.id, change]),
  )
  const confirmed = snapshot.filter((change) => current.get(change.id)?.at === change.at)
  await Promise.all(confirmed.map((change) => deps.pendingChangeStore.getState().remove(change.id)))
}

/**
 * One Sync: peek, classify, apply and push, confirm.
 *
 * Nothing is half-applied. A destructive divergence returns before the cycle runs, and a failure at
 * any phase — a cycle rejects on its first replication error — leaves the log and the checkpoints
 * exactly as they were, so the banner stays accurate and the next attempt starts from the same
 * place.
 */
export async function syncNow(deps: SyncDeps, options: SyncNowOptions = {}): Promise<SyncOutcome> {
  if (!deps.isOnline()) return { kind: 'offline' }

  const started = selectSyncState(deps.syncStateStore.getState())
  const snapshot = [...selectPendingChanges(deps.pendingChangeStore.getState())]

  try {
    const peeked = await peekAll(deps, started.checkpoints)
    const items = await findDestructive(deps, peeked, snapshot, options.answered)
    if (items.length) return { kind: 'needs-review', items }

    const pushed = await deps.cloud.runCycle()
    const seen = advance(started.checkpoints, peeked)
    const { checkpoints, foreignAhead } = stepOverOwnEcho(seen, await peekAll(deps, seen), pushed)

    await clearConfirmed(deps, snapshot)
    // Read again rather than spread the snapshot from the start: Autosync may have been toggled
    // while the cycle ran, and that answer is not this Sync's to overwrite.
    const fresh = selectSyncState(deps.syncStateStore.getState())
    await deps.syncStateStore.getState().save({
      ...fresh,
      checkpoints,
      lastSyncedAt: deps.now(),
      cloudChanged: foreignAhead,
    })

    return peekedCount(peeked) ? { kind: 'merged' } : { kind: 'clean' }
  } catch (error) {
    return { kind: 'failed', reason: errorMessage(error) }
  }
}
