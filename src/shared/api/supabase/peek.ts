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

/** How many ids one round trip asks for. Large, because the payload is three columns wide. */
const PEEK_BATCH = 1000

interface PeekRow {
  id: string
  updated_at: string | null
  deleted: boolean | null
}

/**
 * What moved in `table` since `checkpoint`, without applying any of it.
 *
 * RxDB has no "pull but do not apply" mode — `RxReplicationState` exposes only `reSync`,
 * `awaitInSync` and `cancel`, and `live: false` does not create one. So the peek goes around RxDB
 * entirely, reusing `buildPullFilter` verbatim: the keyset pagination and its same-transaction
 * tie-break come along for free, and the peek can never disagree with the pull about what "since"
 * means.
 *
 * It selects `id, updated_at, deleted` and not `data`, so a month offline costs ids rather than
 * documents. The checkpoint it reads is *ours*, on `syncState` — independent of RxDB's, and
 * advanced only when a Sync completes.
 */
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

/**
 * The full documents behind `ids`. Only the review dialog reaches here, and only for the rows it is
 * about to put a question to the user about.
 */
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

/**
 * Which containers `ids` hang off, as three scalars pulled out of `data` by PostgREST. The classifier
 * needs to know whether an unseen child belongs to a deck or folder this device deleted, and that is
 * all it needs — so it reads the parent fields and never the document.
 */
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
