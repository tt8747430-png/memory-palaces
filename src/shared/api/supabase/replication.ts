import type { RxCollection } from 'rxdb'
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication'
import type { RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type Checkpoint, EPOCH, type Identifiable } from '@/shared/api'
import { docToRow, type PushRow, type Row, rowToDoc } from './document-mapping'

export function buildPushPayload<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  userId: string,
): PushRow[] {
  return rows.map((row) => docToRow(row.newDocumentState, userId))
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
}

export function createCollectionReplication<T extends Identifiable>({
  supabase,
  collection,
  table,
  userId,
  onPushed,
}: CollectionReplicationOptions<T>): RxReplicationState<T, Checkpoint> {
  return replicateRxCollection<T, Checkpoint>({
    collection,
    replicationIdentifier: `supabase-${table}`,
    deletedField: '_deleted',
    live: false,
    push: {
      async handler(rows) {
        const { data, error } = await supabase.rpc('push_documents', {
          p_table: table,
          p_rows: buildPushPayload(rows, userId),
        })
        if (error) throw new Error(error.message)
        onPushed?.(rows.map((row) => row.newDocumentState.id))
        return ((data ?? []) as Row[]).map((row) => rowToDoc<T>(row) as WithDeleted<T>)
      },
    },
    pull: {
      async handler(checkpoint, batchSize) {
        const { data, error } = await supabase
          .from(table)
          .select('id,data,deleted,updated_at')
          .or(buildPullFilter(checkpoint))
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize)
        if (error) throw new Error(error.message)
        return rowsToPullResult<T>((data ?? []) as Row[], checkpoint)
      },
    },
  })
}
