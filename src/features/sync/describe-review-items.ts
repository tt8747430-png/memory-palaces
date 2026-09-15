import { contentKey } from '@/shared/config/sync-tables'
import type { SyncReviewItem, SyncReviewRow } from '@/shared/lib'
import { contentLabel, fetchCloudCopies } from './content-collections'
import type { SyncDeps } from './sync-deps'

/**
 * Names the documents under review, from the cloud's copy — this device deleted its own, so there
 * is nothing local left to read a name off.
 *
 * A document the cloud no longer holds is dropped rather than shown as a blank row: there is nothing
 * left to keep, so there is no question to put. The rows keep the order of `items`.
 */
export async function describeReviewItems(
  deps: SyncDeps,
  items: readonly SyncReviewItem[],
): Promise<SyncReviewRow[]> {
  const labels = new Map(
    (await fetchCloudCopies(deps, items)).map(({ collection, document }) => [
      contentKey(collection, document.id),
      contentLabel(collection, document),
    ]),
  )
  return items.flatMap((item) => {
    const label = labels.get(contentKey(item.collection, item.id))
    return label === undefined ? [] : [{ ...item, label }]
  })
}
