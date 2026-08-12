import type { RxCollection } from 'rxdb'
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication'
import { Subject } from 'rxjs'
import type { RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import type { Identifiable } from '@/shared/api'
import { docToRow, type PushRow, type Row, rowToDoc } from './document-mapping'

/** Where the last pull stopped. `id` breaks ties between rows written in the same transaction. */
export interface Checkpoint {
  updated_at: string
  id: string
}

const EPOCH = '1970-01-01T00:00:00Z'

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
export function buildPullFilter(checkpoint: Checkpoint | undefined): string {
  // The first pull has no id to tie-break against, and `id` is a uuid column — an empty string
  // there is not a "lowest id", it is a type error that fails the very first request.
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
}

/**
 * One collection's half of the sync. RxDB owns the retry loop and the checkpoint; this only maps
 * documents to rows, asks PostgREST for what changed, and forwards Realtime events.
 *
 * A push is a plain upsert: it does not report per-row conflicts back to RxDB, because whichever
 * write lands second is the one the server keeps. Devices still converge — the next pull delivers
 * the master state and the collection's conflict handler resolves it locally.
 */
export function createCollectionReplication<T extends Identifiable>({
  supabase,
  collection,
  table,
  userId,
}: CollectionReplicationOptions<T>): RxReplicationState<T, Checkpoint> {
  const pullStream$ = new Subject<
    { documents: WithDeleted<T>[]; checkpoint: Checkpoint } | 'RESYNC'
  >()

  // The topic must be unique per replication: supabase-js hands back the *existing* channel for a
  // repeated topic, and callbacks cannot be added to one that has already subscribed. Two
  // replications for the same table and user are ordinary — a restart, or a second device
  // simulated in one process — so uniqueness cannot come from the table and user alone.
  const channel = supabase
    .channel(`sync:${table}:${userId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: RealtimePostgresChangesPayload<Row>) => {
        const row = payload.new as Row | undefined
        if (!row?.id) return
        pullStream$.next({
          documents: [rowToDoc<T>(row) as WithDeleted<T>],
          checkpoint: { updated_at: row.updated_at ?? EPOCH, id: row.id },
        })
      },
    )
    .subscribe((status) => {
      // Any (re)connect may have missed events; RESYNC makes RxDB re-pull from its checkpoint.
      if (status === 'SUBSCRIBED') pullStream$.next('RESYNC')
    })

  const replication = replicateRxCollection<T, Checkpoint>({
    collection,
    replicationIdentifier: `supabase-${table}`,
    deletedField: '_deleted',
    live: true,
    push: {
      async handler(rows) {
        const { error } = await supabase
          .from(table)
          .upsert(buildPushPayload(rows, userId), { onConflict: 'id' })
        if (error) throw new Error(error.message)
        return []
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
      stream$: pullStream$.asObservable(),
    },
  })

  // The channel outlives the replication otherwise, and a signed-out user keeps a socket open.
  replication.onCancel.push(() => {
    pullStream$.complete()
    void supabase.removeChannel(channel)
  })

  return replication
}
