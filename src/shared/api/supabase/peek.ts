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
import { buildPullFilter } from './replication'
import { type Row, rowToDoc } from './document-mapping'

const PEEK_BATCH = 1000

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

export async function fetchRemoteDocuments<T extends Identifiable>(
  supabase: SupabaseClient,
  table: SyncedTable,
  ids: readonly string[],
): Promise<CloudDocument<T>[]> {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from(table)
    .select('id,data,deleted,updated_at')
    .in('id', [...ids])
  if (error) throw new Error(error.message)
  return ((data ?? []) as Row[]).map((row) => rowToDoc<T>(row))
}

export async function fetchRemoteParents(
  supabase: SupabaseClient,
  table: SyncedTable,
  ids: readonly string[],
): Promise<RemoteParents[]> {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from(table)
    .select('id,deckId:data->>deckId,parentId:data->>parentId,folderId:data->>folderId')
    .in('id', [...ids])
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RemoteParents[]
}
