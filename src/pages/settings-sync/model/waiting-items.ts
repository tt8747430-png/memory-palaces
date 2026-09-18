import { type ContentCollection, isContentCollection } from '@/shared/config/sync-tables'
import type { PendingChange } from '@/entities/pending-change'

export interface WaitingItem {
  id: string
  label: string
  op: PendingChange['op']
}

/** One table's documents by id, named the way the learner knows them. */
export function namesBy<T extends { id: string }>(
  documents: readonly T[],
  name: (document: T) => string,
): ReadonlyMap<string, string> {
  return new Map(documents.map((document) => [document.id, name(document)]))
}

/**
 * The documents waiting on one content table, named for the sheet. A document already removed
 * here has no name left on the device, so its id stands in.
 */
export function waitingItems(
  changes: readonly PendingChange[],
  table: ContentCollection,
  names: ReadonlyMap<string, string>,
): WaitingItem[] {
  return changes.flatMap((change) => {
    if (change.table !== table || !isContentCollection(change.table)) return []
    return [
      {
        id: change.entityId,
        label: names.get(change.entityId) ?? change.entityId,
        op: change.op,
      },
    ]
  })
}
