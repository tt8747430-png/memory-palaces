import { pendingKey, type SyncedTable } from '@/shared/config/sync-tables'

export type PendingOp = 'save' | 'remove'

/** One write to a synced document that no Sync has confirmed yet, on any synced table. */
export interface PendingChange {
  id: string
  table: SyncedTable
  entityId: string
  op: PendingOp
  at: string
}

export interface MakePendingChangeInput {
  table: SyncedTable
  entityId: string
  op: PendingOp
  at: string
}

export function makePendingChange(input: MakePendingChangeInput): PendingChange {
  if (!input.entityId) throw new Error('A pending change belongs to a document')
  if (!input.at) throw new Error('A pending change happened at a time')
  return {
    id: pendingKey(input.table, input.entityId),
    table: input.table,
    entityId: input.entityId,
    op: input.op,
    at: input.at,
  }
}
