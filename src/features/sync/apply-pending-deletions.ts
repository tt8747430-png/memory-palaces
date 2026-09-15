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

async function confirmDeletion(deps: SyncDeps, item: SyncReviewItem): Promise<void> {
  const refs = [item, ...(item.descendants ?? [])]
  for (const { collection, document } of await fetchCloudCopies(deps, refs)) {
    const store = contentWriter(deps, collection)
    await store.save(document)
    await store.remove(document.id)
  }
}

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
  return syncNow(deps, { answered: keysOf(decisions) })
}
