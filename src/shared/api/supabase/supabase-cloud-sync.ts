import type { SupabaseClient } from '@supabase/supabase-js'
import type { CloudSyncPort } from '@/shared/api'
import { fetchRemoteDocuments, fetchRemoteParents, peekRemoteChanges } from './peek'
import type { SyncManager } from './sync-manager'

export function createSupabaseCloudSync(
  supabase: SupabaseClient,
  manager: Pick<SyncManager, 'runCycle' | 'forget'>,
): CloudSyncPort {
  return {
    peek: (table, checkpoint) => peekRemoteChanges(supabase, table, checkpoint),
    parents: (table, ids) => fetchRemoteParents(supabase, table, ids),
    fetch: (table, ids) => fetchRemoteDocuments(supabase, table, ids),
    runCycle: () => manager.runCycle(),
    forget: () => manager.forget(),
  }
}
