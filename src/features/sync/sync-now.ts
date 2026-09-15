import { errorMessage, type SyncOutcome } from '@/shared/lib'
import { type PendingChange, selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { advance, findDestructive, peekAll, peekedCount, stepOverOwnEcho } from './divergence'
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
