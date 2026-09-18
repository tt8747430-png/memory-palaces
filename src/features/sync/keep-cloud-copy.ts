import { CONTENT_COLLECTIONS, pendingKey } from '@/shared/config/sync-tables'
import type { SyncReviewItem } from '@/shared/lib'
import { selectPendingChanges } from '@/entities/pending-change'
import { contentWriter, fetchCloudCopies } from './content-collections'
import { cloudDescendants } from './divergence'
import type { SyncDeps } from './sync-deps'

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
      removed
        .filter((change) => change.table === collection)
        .map((change) => change.entityId),
    ]),
  )
  const subtree = await cloudDescendants(deps, [item.id], candidates)
  const restore = [item, ...subtree.values()].filter(
    (ref) => !deleted.has(pendingKey(ref.collection, ref.id)),
  )

  for (const { collection, document } of await fetchCloudCopies(deps, restore)) {
    await contentWriter(deps, collection).save(document)
    await deps.pendingChangeStore.getState().remove(pendingKey(collection, document.id))
  }
}
