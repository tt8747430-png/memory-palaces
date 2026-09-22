import type { SyncOutcome } from '@/shared/lib'
import { selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { findDestructive, peekAll } from './divergence'
import { failed } from './failed'
import type { SyncDeps } from './sync-deps'

export async function findReviewItems(deps: SyncDeps): Promise<SyncOutcome> {
  if (!deps.isOnline()) return { kind: 'offline' }
  try {
    const state = selectSyncState(deps.syncStateStore.getState())
    const pending = selectPendingChanges(deps.pendingChangeStore.getState())
    // Only a held table can hold a destructive divergence: the content collections are all held.
    const items = await findDestructive(
      deps,
      await peekAll(deps, state.checkpoints, deps.held),
      pending,
    )
    return items.length ? { kind: 'needs-review', items } : { kind: 'clean' }
  } catch (error) {
    return failed(error)
  }
}
