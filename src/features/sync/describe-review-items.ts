import { contentKey } from '@/shared/config/sync-tables'
import type { SyncReviewItem, SyncReviewRow } from '@/shared/lib'
import { contentLabel, fetchCloudCopies } from './content-collections'
import type { SyncDeps } from './sync-deps'

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
