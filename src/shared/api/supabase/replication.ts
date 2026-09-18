import type { RxCollection } from 'rxdb'
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication'
import type { RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type Checkpoint, EPOCH, type Identifiable } from '@/shared/api'
import { docToRow, type PushBase, type PushRow, type Row, rowToDoc } from './document-mapping'
import { requestSignal } from './request-timeout'

/**
 * The server copy RxDB recorded when this device last pulled the document: its clock, and whether
 * it was a deletion — which keeps the clock, so the clock alone cannot tell.
 */
const baseOf = <T>(row: RxReplicationWriteToMasterRow<T>): PushBase | null => {
  const seen = row.assumedMasterState as { updatedAt?: unknown; _deleted?: boolean } | undefined
  return typeof seen?.updatedAt === 'string'
    ? { updatedAt: seen.updatedAt, deleted: Boolean(seen._deleted) }
    : null
}

export function buildPushPayload<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  userId: string,
): PushRow[] {
  return rows.map((row) => docToRow(row.newDocumentState, userId, baseOf(row)))
}

export function buildPullFilter(checkpoint: Checkpoint | undefined | null): string {
  if (!checkpoint) return `updated_at.gt."${EPOCH}"`
  const { updated_at: at, id } = checkpoint
  return `updated_at.gt."${at}",and(updated_at.eq."${at}",id.gt."${id}")`
}

export function rowsToPullResult<T extends Identifiable>(
  rows: Row[],
  previous: Checkpoint | undefined,
): { documents: WithDeleted<T>[]; checkpoint: Checkpoint | undefined } {
  const last = rows.at(-1)
  return {
    documents: rows.map((row) => rowToDoc<T>(row)) as WithDeleted<T>[],
    checkpoint: last ? { updated_at: last.updated_at ?? EPOCH, id: last.id } : previous,
  }
}

export interface CollectionReplicationOptions<T> {
  supabase: SupabaseClient
  collection: RxCollection<T>
  table: string
  userId: string
  onPushed?: (ids: readonly string[]) => void
  /**
   * Pull from the first document rather than from the checkpoint. Only the checkpoint is passed
   * over: what each document was based on stays, so a change waiting here still merges against it.
   */
  fromStart?: boolean
}

/**
 * Every push row says which server copy it was based on, and the server refuses a write over any
 * other (`push_documents`): what it hands back is the current copy, which RxDB resolves through
 * the collection's conflict handler — against that same base — and pushes again.
 */
export function createCollectionReplication<T extends Identifiable>({
  supabase,
  collection,
  table,
  userId,
  onPushed,
  fromStart = false,
}: CollectionReplicationOptions<T>): RxReplicationState<T, Checkpoint> {
  // Once a batch has come back, RxDB hands the handler the checkpoint that batch ended on.
  let rereading = fromStart
  return replicateRxCollection<T, Checkpoint>({
    collection,
    replicationIdentifier: `supabase-${table}`,
    deletedField: '_deleted',
    live: false,
    push: {
      async handler(rows) {
        const { data, error } = await supabase
          .rpc('push_documents', { p_table: table, p_rows: buildPushPayload(rows, userId) })
          .abortSignal(requestSignal())
        if (error) throw new Error(error.message)
        const refused = ((data ?? []) as Row[]).map((row) => rowToDoc<T>(row) as WithDeleted<T>)
        const held = new Set(refused.map((row) => row.id))
        onPushed?.(
          rows.flatMap((row) =>
            held.has(row.newDocumentState.id) ? [] : [row.newDocumentState.id],
          ),
        )
        return refused
      },
    },
    pull: {
      async handler(checkpoint, batchSize) {
        const since = rereading ? undefined : checkpoint
        const { data, error } = await supabase
          .from(table)
          .select('id,data,deleted,updated_at')
          .or(buildPullFilter(since))
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize)
          .abortSignal(requestSignal())
        if (error) throw new Error(error.message)
        rereading = false
        return rowsToPullResult<T>((data ?? []) as Row[], since)
      },
    },
  })
}
