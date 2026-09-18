import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type Checkpoint,
  type CloudDocument,
  EPOCH,
  type Identifiable,
  type RemoteChange,
  type RemoteParents,
} from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { chunk } from '@/shared/lib'
import { buildPullFilter } from './replication'
import { type Row, rowToDoc } from './document-mapping'
import { requestSignal } from './request-timeout'

const PEEK_BATCH = 1000
/** Ids per `in(...)` request: a URL carries the whole list, and a thousand of them is too long. */
export const ID_BATCH = 100

interface PeekRow {
  id: string
  updated_at: string | null
  deleted: boolean | null
}

export async function peekRemoteChanges(
  supabase: SupabaseClient,
  table: SyncedTable,
  checkpoint: Checkpoint | null,
): Promise<RemoteChange[]> {
  const changes: RemoteChange[] = []
  let cursor = checkpoint

  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select('id,updated_at,deleted')
      .or(buildPullFilter(cursor))
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(PEEK_BATCH)
      .abortSignal(requestSignal())
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as PeekRow[]
    for (const row of rows) {
      changes.push({
        id: row.id,
        updated_at: row.updated_at ?? EPOCH,
        deleted: Boolean(row.deleted),
      })
    }

    const last = changes.at(-1)
    if (rows.length < PEEK_BATCH || !last) return changes
    cursor = { updated_at: last.updated_at, id: last.id }
  }
}

/** `select` over the ids, a batch at a time, the batches concatenated in order. */
async function byIds<T>(
  supabase: SupabaseClient,
  table: SyncedTable,
  columns: string,
  ids: readonly string[],
): Promise<T[]> {
  const batches = await Promise.all(
    chunk(ids, ID_BATCH).map(async (batch) => {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .in('id', batch)
        .abortSignal(requestSignal())
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as T[]
    }),
  )
  return batches.flat()
}

export async function fetchRemoteDocuments<T extends Identifiable>(
  supabase: SupabaseClient,
  table: SyncedTable,
  ids: readonly string[],
): Promise<CloudDocument<T>[]> {
  const rows = await byIds<Row>(supabase, table, 'id,data,deleted,updated_at', ids)
  return rows.map((row) => rowToDoc<T>(row))
}

export async function fetchRemoteParents(
  supabase: SupabaseClient,
  table: SyncedTable,
  ids: readonly string[],
): Promise<RemoteParents[]> {
  return byIds<RemoteParents>(
    supabase,
    table,
    'id,deckId:data->>deckId,parentId:data->>parentId,folderId:data->>folderId',
    ids,
  )
}
