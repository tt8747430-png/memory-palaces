import { errorMessage, type SyncOutcome } from '@/shared/lib'
import { pendingIn, selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { advance, peekAll, peekedCount, scopedCheckpoints, stepOverOwnEcho } from './divergence'
import { clearConfirmed } from './clear-confirmed'
import type { SyncDeps } from './sync-deps'

/**
 * The cycle nobody asked for, over the quiet tables: preferences and the profile go up as soon as
 * they change, on every device, whatever Autosync says.
 *
 * It is deliberately smaller than a Sync. It asks nothing — only a content collection can diverge
 * destructively, and none of them is quiet. It writes no line in the Sync log and does not move
 * `lastSyncedAt`, because that date answers "when did my work last go up" and this was not their
 * work. A failure is silent: the rows stay in the Pending log and the next change or page event
 * carries them.
 */
export async function quietSync(deps: SyncDeps): Promise<SyncOutcome> {
  if (!deps.quiet.length) return { kind: 'clean' }
  if (!deps.isOnline()) return { kind: 'offline' }

  const started = selectSyncState(deps.syncStateStore.getState())
  const snapshot = pendingIn(selectPendingChanges(deps.pendingChangeStore.getState()), deps.quiet)

  try {
    const peeked = await peekAll(deps, started.checkpoints, deps.quiet)
    const pushed = await deps.cloud.runCycle(deps.quiet)
    const seen = advance(started.checkpoints, peeked)
    const { checkpoints } = stepOverOwnEcho(
      seen,
      await peekAll(deps, seen, deps.quiet),
      pushed,
      // Nothing quiet is ever reported as ahead: this cycle is the answer to it having moved.
      [],
    )

    await clearConfirmed(deps, snapshot)
    // Only the quiet tables' checkpoints, merged onto whatever a Sync wrote while this ran — a
    // held checkpoint read before the cycle would be stale by now.
    const fresh = selectSyncState(deps.syncStateStore.getState())
    await deps.syncStateStore.getState().save({
      ...fresh,
      checkpoints: { ...fresh.checkpoints, ...scopedCheckpoints(checkpoints, deps.quiet) },
    })

    return { kind: peekedCount(peeked) ? 'merged' : 'clean' }
  } catch (error) {
    return { kind: 'failed', reason: errorMessage(error) }
  }
}
