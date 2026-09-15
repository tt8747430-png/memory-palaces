import { type ContentCollection, contentKey } from '@/shared/config/sync-tables'

export type PendingOp = 'save' | 'remove'

export interface PendingChange {
  id: string
  contentCollection: ContentCollection
  entityId: string
  op: PendingOp
  at: string
}

export interface MakePendingChangeInput {
  contentCollection: ContentCollection
  entityId: string
  op: PendingOp
  at: string
}

export function makePendingChange(input: MakePendingChangeInput): PendingChange {
  if (!input.entityId) throw new Error('A pending change belongs to a document')
  if (!input.at) throw new Error('A pending change happened at a time')
  return {
    id: contentKey(input.contentCollection, input.entityId),
    contentCollection: input.contentCollection,
    entityId: input.entityId,
    op: input.op,
    at: input.at,
  }
}
