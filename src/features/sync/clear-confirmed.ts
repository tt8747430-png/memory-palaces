import { type PendingChange, selectPendingChanges } from '@/entities/pending-change'
import type { SyncDeps } from './sync-deps'

/**
 * Drops the Pending changes a cycle just confirmed. A row is only dropped when it is still exactly
 * what the snapshot saw: an edit made while the cycle ran stamps a newer `at`, and that write has
 * not been confirmed by anything.
 *
 * Both cadences clear the same way — the only difference is the snapshot they were handed.
 */
export async function clearConfirmed(
  deps: Pick<SyncDeps, 'pendingChangeStore'>,
  snapshot: readonly PendingChange[],
): Promise<void> {
  const current = new Map(
    selectPendingChanges(deps.pendingChangeStore.getState()).map((change) => [change.id, change]),
  )
  const confirmed = snapshot.filter((change) => current.get(change.id)?.at === change.at)
  await Promise.all(confirmed.map((change) => deps.pendingChangeStore.getState().remove(change.id)))
}
