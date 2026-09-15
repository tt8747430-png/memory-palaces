import type { RxCollection } from 'rxdb'
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication'
import type { RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type Checkpoint, EPOCH, type Identifiable } from '@/shared/api'
import { docToRow, type PushRow, type Row, rowToDoc } from './document-mapping'

/**
 * `user_id` travels for readability only — `push_documents` takes the owner from `auth.uid()`, so a
 * client cannot write rows into somebody else's account by editing this payload.
 */
export function buildPushPayload<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  userId: string,
): PushRow[] {
  return rows.map((row) => docToRow(row.newDocumentState, userId))
}

/**
 * Keyset pagination, not a plain `updated_at >` — Postgres stamps every row written in one
 * transaction with the same `now()`, so a push of more rows than the pull batch size would leave
 * the rest of that transaction permanently behind the checkpoint.
 */
export function buildPullFilter(checkpoint: Checkpoint | undefined | null): string {
  // The first pull has nothing to tie-break against, so it asks for no id bound at all: an empty
  // string is not a "lowest id", and against the original uuid column it was a hard type error.
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
  /** Told the ids of every batch the server accepted or refused — the rows this cycle wrote. */
  onPushed?: (ids: readonly string[]) => void
}

/**
 * One collection's half of one Sync cycle. RxDB owns the retry loop and its own checkpoint; this
 * only maps documents to rows, asks PostgREST for what changed, and hands the writes to
 * `push_documents`, which declines to overwrite a document whose server copy is newer and hands
 * those rows back. RxDB takes them as conflicts and runs the collection's conflict handler, so a
 * device returning from a week offline merges with what happened meanwhile instead of flattening it.
 *
 * **`live: false`, and no Realtime channel.** Sync is user-initiated: a replication exists only for
 * the length of a cycle, so a channel inside it would be torn down between syncs and miss exactly
 * the events the banner needs. Watching the cloud is `createCloudWatcher`'s job — one long-lived
 * subscription, which is also why the random-topic workaround this function used to need is gone.
 */
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
        // Whatever the server refused is newer than what we sent; RxDB resolves and re-pushes.
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
