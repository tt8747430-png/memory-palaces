import { type ContentCollection, contentKey } from '@/shared/config/sync-tables'

/** What happened to the document. There is no third: an edit and a create are both a save. */
export type PendingOp = 'save' | 'remove'

/**
 * One document whose current state has not been confirmed by a Sync.
 *
 * The log records a document's **net** state relative to the last Sync, not its history: repeated
 * edits collapse onto one entry, a save after a remove replaces the remove, and a remove after a
 * save replaces the save. That is why the id is derived from the document rather than generated —
 * `contentKey` is what makes the collapse an upsert instead of a search.
 *
 * It does not drive the push. RxDB's own checkpoint does that. This exists to answer two questions
 * the replication cannot: how many changes are pending, and which of them are destructive.
 */
export interface PendingChange {
  /** `contentKey(collection, entityId)` — which is what makes the collapse an upsert. */
  id: string
  collection: ContentCollection
  entityId: string
  op: PendingOp
  /** When the write happened. Not `updatedAt`: this collection is device-local and never replicates. */
  at: string
}

export interface MakePendingChangeInput {
  collection: ContentCollection
  entityId: string
  op: PendingOp
  at: string
}

export function makePendingChange(input: MakePendingChangeInput): PendingChange {
  if (!input.entityId) throw new Error('A pending change belongs to a document')
  if (!input.at) throw new Error('A pending change happened at a time')
  return {
    id: contentKey(input.collection, input.entityId),
    collection: input.collection,
    entityId: input.entityId,
    op: input.op,
    at: input.at,
  }
}
