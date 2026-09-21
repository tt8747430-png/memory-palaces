import { authFailure, errorMessage, type SyncOutcome } from '@/shared/lib'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { pendingIn, selectPendingChanges } from '@/entities/pending-change'
import { appendSyncLog, selectSyncState, type SyncLogEntry } from '@/entities/sync-state'
import { advance, findDestructive, peekAll, peekedCount, stepOverOwnEcho } from './divergence'
import { clearConfirmed } from './clear-confirmed'
import type { PushedIds } from '@/shared/api'
import type { SyncDeps } from './sync-deps'

export interface SyncNowOptions {
  answered?: ReadonlySet<string>
  /**
   * The tables this Sync covers. The held ones by default — the learner asked for their work to go
   * up, not for the furniture. A Repair and the first Sync on a device pass every live table.
   */
  tables?: readonly SyncedTable[]
}

/** What this Sync carries: the held tables, unless the caller widened it. */
const scopeOf = (deps: SyncDeps, options: SyncNowOptions): readonly SyncedTable[] =>
  options.tables ?? deps.held

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

/**
 * One cycle, reported but not logged as failed: whether a failure is the end of the Sync is
 * `syncNow`'s to decide, and a token it can refresh does not deserve a line in the log.
 */
async function attemptSync(deps: SyncDeps, options: SyncNowOptions): Promise<SyncOutcome> {
  const started = selectSyncState(deps.syncStateStore.getState())
  const tables = scopeOf(deps, options)
  // Only what this cycle carries: a disabled extension's changes — and every quiet one — wait in
  // the log, and must not be cleared by a cycle that never pushed them.
  const snapshot = pendingIn(selectPendingChanges(deps.pendingChangeStore.getState()), tables)

  try {
    const peeked = await peekAll(deps, started.checkpoints, tables)
    const items = await findDestructive(deps, peeked, snapshot, options.answered)
    if (items.length) {
      await logSync(deps, { outcome: 'needs-review', pushed: 0, pulled: 0 })
      return { kind: 'needs-review', items }
    }

    const pushed = await deps.cloud.runCycle(tables)
    const seen = advance(started.checkpoints, peeked)
    const { checkpoints, foreignAhead } = stepOverOwnEcho(
      seen,
      await peekAll(deps, seen, tables),
      pushed,
      deps.held,
    )

    await clearConfirmed(deps, snapshot)
    const pulled = peekedCount(peeked)
    const outcome = pulled ? 'merged' : 'clean'
    const fresh = selectSyncState(deps.syncStateStore.getState())
    await deps.syncStateStore.getState().save({
      ...fresh,
      checkpoints: { ...fresh.checkpoints, ...checkpoints },
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
    return { kind: 'failed', reason: errorMessage(error) }
  }
}

export async function syncNow(deps: SyncDeps, options: SyncNowOptions = {}): Promise<SyncOutcome> {
  if (!deps.isOnline()) return { kind: 'offline' }

  let outcome = await attemptSync(deps, options)
  if (outcome.kind === 'failed') {
    // A refused token is worth one more try behind a fresh one. A device clock the server reads
    // as being in the future is not: every token it is handed looks issued ahead of time, and
    // only the learner can put that right — so the Sync says so instead of trying again.
    const failure = authFailure(outcome.reason)
    if (failure === 'token' && (await deps.refreshAuth().catch(() => false))) {
      outcome = await attemptSync(deps, options)
    }
  }
  if (outcome.kind === 'failed') {
    const reason = authFailure(outcome.reason) ?? outcome.reason
    await logSync(deps, { outcome: 'failed', pushed: 0, pulled: 0, reason })
    return { kind: 'failed', reason }
  }
  return outcome
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
  // Everything means everything: the quiet tables are read again here, which is the one place a
  // learner asks for them by name.
  return syncNow(deps, { tables: deps.tables })
}
