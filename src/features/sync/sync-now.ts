import { errorMessage, type SyncOutcome } from '@/shared/lib'
import { type PendingChange, pendingIn, selectPendingChanges } from '@/entities/pending-change'
import { appendSyncLog, selectSyncState, type SyncLogEntry } from '@/entities/sync-state'
import { advance, findDestructive, peekAll, peekedCount, stepOverOwnEcho } from './divergence'
import type { PushedIds } from '@/shared/api'
import type { SyncDeps } from './sync-deps'

export interface SyncNowOptions {
  answered?: ReadonlySet<string>
}

async function clearConfirmed(deps: SyncDeps, snapshot: readonly PendingChange[]): Promise<void> {
  const current = new Map(
    selectPendingChanges(deps.pendingChangeStore.getState()).map((change) => [change.id, change]),
  )
  const confirmed = snapshot.filter((change) => current.get(change.id)?.at === change.at)
  await Promise.all(confirmed.map((change) => deps.pendingChangeStore.getState().remove(change.id)))
}

const pushedCount = (pushed: PushedIds): number =>
  Object.values(pushed).reduce((total, ids) => total + (ids?.length ?? 0), 0)

/** Writes one line of the device's Sync log. The log is bookkeeping: failing to write it is not a failed Sync. */
async function logSync(deps: SyncDeps, entry: Omit<SyncLogEntry, 'at'>): Promise<void> {
  const fresh = selectSyncState(deps.syncStateStore.getState())
  await deps.syncStateStore
    .getState()
    .save({ ...fresh, log: appendSyncLog(fresh.log, { at: deps.now(), ...entry }) })
    .catch(() => {})
}

export async function syncNow(deps: SyncDeps, options: SyncNowOptions = {}): Promise<SyncOutcome> {
  if (!deps.isOnline()) return { kind: 'offline' }

  const started = selectSyncState(deps.syncStateStore.getState())
  // Only what this cycle carries: a disabled extension's changes wait in the log for its return,
  // and must not be cleared by a cycle that never pushed them.
  const snapshot = pendingIn(selectPendingChanges(deps.pendingChangeStore.getState()), deps.tables)

  try {
    const peeked = await peekAll(deps, started.checkpoints)
    const items = await findDestructive(deps, peeked, snapshot, options.answered)
    if (items.length) {
      await logSync(deps, { outcome: 'needs-review', pushed: 0, pulled: 0 })
      return { kind: 'needs-review', items }
    }

    const pushed = await deps.cloud.runCycle()
    const seen = advance(started.checkpoints, peeked)
    const { checkpoints, foreignAhead } = stepOverOwnEcho(seen, await peekAll(deps, seen), pushed)

    await clearConfirmed(deps, snapshot)
    const pulled = peekedCount(peeked)
    const outcome = pulled ? 'merged' : 'clean'
    const fresh = selectSyncState(deps.syncStateStore.getState())
    await deps.syncStateStore.getState().save({
      ...fresh,
      checkpoints,
      lastSyncedAt: deps.now(),
      cloudChanged: foreignAhead,
      log: appendSyncLog(fresh.log, {
        at: deps.now(),
        outcome,
        pushed: pushedCount(pushed),
        pulled,
      }),
    })

    return { kind: outcome }
  } catch (error) {
    const reason = errorMessage(error)
    await logSync(deps, { outcome: 'failed', pushed: 0, pulled: 0, reason })
    return { kind: 'failed', reason }
  }
}

/**
 * A Sync that reads the whole cloud again: the checkpoints go, every replication pulls from the
 * first document, and each one lands through the conflict handlers — a change waiting here merged
 * field by field against the copy it was based on, never dropped. For a device that looks out of
 * date when the log says otherwise.
 */
export async function repairSync(deps: SyncDeps): Promise<SyncOutcome> {
  if (!deps.isOnline()) return { kind: 'offline' }
  try {
    await deps.cloud.rereadEverything()
    const fresh = selectSyncState(deps.syncStateStore.getState())
    await deps.syncStateStore.getState().save({ ...fresh, checkpoints: {} })
  } catch (error) {
    return { kind: 'failed', reason: errorMessage(error) }
  }
  return syncNow(deps)
}
