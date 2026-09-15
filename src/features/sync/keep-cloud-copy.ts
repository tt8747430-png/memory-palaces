import { CONTENT_COLLECTIONS, contentKey } from '@/shared/config/sync-tables'
import type { SyncReviewItem } from '@/shared/lib'
import { selectPendingChanges } from '@/entities/pending-change'
import { contentWriter, fetchCloudCopies } from './content-collections'
import { cloudDescendants } from './divergence'
import type { SyncDeps } from './sync-deps'

/**
 * What **Keep** does in the review dialog: the cloud's copy comes back into the local collection,
 * un-deleted, and its pending change is dropped — the device now holds exactly what the cloud holds,
 * so there is nothing left to push.
 *
 * For a deck or folder, "the document" is the subtree. Deleting it here took its subdecks, cards
 * and questions with it; keeping it brings back every one of those the cloud still has, or the
 * person would keep a deck and find it empty. Anything another device added inside it arrives with
 * the next pull on its own.
 *
 * Except what the person answered **Delete** for in the same review: a card deleted here and edited
 * elsewhere is its own question, and its answer stands whatever was decided about the deck around
 * it. `deleted` carries those keys, so the two answers cannot race each other for the document.
 *
 * Written with the cloud's own clock, never a fresh one, so a restored copy cannot outrank a newer
 * edit anywhere else. A document the cloud no longer holds is nothing to keep: its deletion stands.
 */
export async function keepCloudCopy(
  deps: SyncDeps,
  item: SyncReviewItem,
  deleted: ReadonlySet<string> = new Set(),
): Promise<void> {
  const removed = selectPendingChanges(deps.pendingChangeStore.getState()).filter(
    (change) => change.op === 'remove',
  )
  const candidates = new Map(
    CONTENT_COLLECTIONS.map((collection) => [
      collection,
      removed.filter((change) => change.collection === collection).map((change) => change.entityId),
    ]),
  )
  const subtree = await cloudDescendants(deps, [item.id], candidates)
  const restore = [item, ...subtree.values()].filter(
    (ref) => !deleted.has(contentKey(ref.collection, ref.id)),
  )

  for (const { collection, document } of await fetchCloudCopies(deps, restore)) {
    await contentWriter(deps, collection).save(document)
    await deps.pendingChangeStore.getState().remove(contentKey(collection, document.id))
  }
}
