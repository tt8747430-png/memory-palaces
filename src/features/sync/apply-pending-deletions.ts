import { contentKey } from '@/shared/config/sync-tables'
import type { SyncOutcome, SyncReviewDecision, SyncReviewItem } from '@/shared/lib'
import { contentWriter, fetchCloudCopies } from './content-collections'
import { keepCloudCopy } from './keep-cloud-copy'
import type { SyncDeps } from './sync-deps'
import { syncNow } from './sync-now'

const keysOf = (items: readonly SyncReviewItem[]): Set<string> =>
  new Set(
    items.flatMap((item) =>
      [item, ...(item.descendants ?? [])].map((ref) => contentKey(ref.collection, ref.id)),
    ),
  )

/**
 * Makes a **Delete** answer stick.
 *
 * The tombstone this device wrote carries the moment of the deletion, and the other device's edit is
 * by definition later — so pushed as it stands it loses: `push_documents` refuses it and
 * `lastWriteWins` hands the document straight back. Re-deleting now dates the tombstone after the
 * edit the person has just seen and overruled.
 *
 * The container's unseen descendants are tombstoned too. Another device added or edited them inside
 * the deck being deleted; left alone they would pull down as cards belonging to nothing.
 */
async function confirmDeletion(deps: SyncDeps, item: SyncReviewItem): Promise<void> {
  const refs = [item, ...(item.descendants ?? [])]
  for (const { collection, document } of await fetchCloudCopies(deps, refs)) {
    const store = contentWriter(deps, collection)
    await store.save(document)
    await store.remove(document.id)
  }
}

/**
 * Finishes the Sync a destructive divergence interrupted: every answer is applied as a real write,
 * then the cycle runs with those documents marked answered. Anything that arrived in the meantime
 * is still asked about.
 *
 * The answers run together, and can, because a Keep is told which documents were answered Delete
 * and leaves them alone — so no two answers ever write the same document.
 */
export async function applyPendingDeletions(
  deps: SyncDeps,
  decisions: readonly SyncReviewDecision[],
): Promise<SyncOutcome> {
  const deleted = keysOf(decisions.filter((decision) => !decision.keep))
  await Promise.all(
    decisions.map((decision) =>
      decision.keep ? keepCloudCopy(deps, decision, deleted) : confirmDeletion(deps, decision),
    ),
  )
  // A container's descendants were answered with it: tombstoning them writes a pending remove over a
  // remote change, and without their keys here that is the same question asked all over again.
  return syncNow(deps, { answered: keysOf(decisions) })
}
