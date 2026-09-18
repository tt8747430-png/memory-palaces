import { type ContentCollection, isContentCollection } from '@/shared/config/sync-tables'
import type { PendingChange } from '@/entities/pending-change'

export interface WaitingItem {
  id: string
  label: string
  op: PendingChange['op']
}

/**
 * The documents waiting on one content table, named for the sheet. A document already removed
 * here has no name left on the device, so its id stands in.
 */
export function waitingItems(
  changes: readonly PendingChange[],
  table: ContentCollection,
  nameOf: (collection: ContentCollection, id: string) => string | undefined,
): WaitingItem[] {
  return changes.flatMap((change) => {
    if (change.table !== table || !isContentCollection(change.table)) return []
    return [
      {
        id: change.entityId,
        label: nameOf(table, change.entityId) ?? change.entityId,
        op: change.op,
      },
    ]
  })
}
