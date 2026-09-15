export {
  supabase,
  isConfigured,
  isSupabaseConfigured,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from './client'
export { SupabaseAuthGateway } from './supabase-auth-gateway'
export { createCollectionReplication } from './replication'
export { fetchRemoteDocuments, fetchRemoteParents, peekRemoteChanges } from './peek'
export { createCloudWatcher, type CloudWatcher } from './cloud-watcher'
export { SyncManager, type SyncTarget } from './sync-manager'
export { createSupabaseCloudSync } from './supabase-cloud-sync'
export { SupabaseStorage } from './supabase-storage'
export { SupabaseAccountDeletion } from './supabase-account-deletion'
