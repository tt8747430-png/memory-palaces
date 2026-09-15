import type { SupabaseClient } from '@supabase/supabase-js'
import type { CloudSyncPort } from '@/shared/api'
import { fetchRemoteDocuments, fetchRemoteParents, peekRemoteChanges } from './peek'
import type { SyncManager } from './sync-manager'

/**
 * The Supabase side of `CloudSyncPort`: three read-only PostgREST queries, and the cycle the manager
 * owns. Assembled here rather than on `SyncManager`, which would only have forwarded them.
 */
export function createSupabaseCloudSync(
  supabase: SupabaseClient,
  manager: Pick<SyncManager, 'runCycle'>,
): CloudSyncPort {
  return {
    peek: (table, checkpoint) => peekRemoteChanges(supabase, table, checkpoint),
    parents: (table, ids) => fetchRemoteParents(supabase, table, ids),
    fetch: (table, ids) => fetchRemoteDocuments(supabase, table, ids),
    runCycle: () => manager.runCycle(),
  }
}
