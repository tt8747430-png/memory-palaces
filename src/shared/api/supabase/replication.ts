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

/**
 * The rows the server may take, and the server copies to hand back as conflicts instead: any row
 * whose server copy is not the one this device last saw (`assumedMasterState`) — another device
 * changed it since, or this device never pulled it. `push_documents` only compares clocks, so
 * without this a stale device with a newer clock overwrites the whole document unmerged.
 */
export function splitUnseenOverwrites<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  server: Row[],
): { pushable: RxReplicationWriteToMasterRow<T>[]; refused: WithDeleted<T>[] } {
  const held = new Map(server.map((row) => [row.id, row]))
  const pushable: RxReplicationWriteToMasterRow<T>[] = []
  const refused: WithDeleted<T>[] = []
  for (const row of rows) {
    const current = held.get(row.newDocumentState.id)
    const lastSeen = (row.assumedMasterState as { updatedAt?: unknown } | undefined)?.updatedAt
    if (!current || (lastSeen !== undefined && current.data.updatedAt === lastSeen)) {
      pushable.push(row)
    } else {
      refused.push(rowToDoc<T>(current) as WithDeleted<T>)
    }
  }
  return { pushable, refused }
}

export interface CollectionReplicationOptions<T> {
  supabase: SupabaseClient
  collection: RxCollection<T>
  table: string
  userId: string
  /**
   * Hand back, as a conflict, any write over a server copy this device never saw — so the
   * collection's conflict handler merges it. For a collection whose handler merges field by field.
   */
  refuseUnseenOverwrites?: boolean
  onPushed?: (ids: readonly string[]) => void
}

export function createCollectionReplication<T extends Identifiable>({
  supabase,
  collection,
  table,
  userId,
  refuseUnseenOverwrites = false,
  onPushed,
}: CollectionReplicationOptions<T>): RxReplicationState<T, Checkpoint> {
  const unseen = async (rows: RxReplicationWriteToMasterRow<T>[]) => {
    if (!refuseUnseenOverwrites) return { pushable: rows, refused: [] }
    const { data, error } = await supabase
      .from(table)
      .select('id,data,deleted,updated_at')
      .in(
        'id',
        rows.map((row) => row.newDocumentState.id),
      )
    if (error) throw new Error(error.message)
    return splitUnseenOverwrites(rows, (data ?? []) as Row[])
  }

  return replicateRxCollection<T, Checkpoint>({
    collection,
    replicationIdentifier: `supabase-${table}`,
    deletedField: '_deleted',
    live: false,
    push: {
      async handler(rows) {
        const { pushable, refused } = await unseen(rows)
        if (pushable.length === 0) return refused
        const { data, error } = await supabase.rpc('push_documents', {
          p_table: table,
          p_rows: buildPushPayload(pushable, userId),
        })
        if (error) throw new Error(error.message)
        onPushed?.(pushable.map((row) => row.newDocumentState.id))
        return [
          ...refused,
          ...((data ?? []) as Row[]).map((row) => rowToDoc<T>(row) as WithDeleted<T>),
        ]
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
