export {
  supabase,
  isConfigured,
  isSupabaseConfigured,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from './client'
export { SupabaseAuthGateway } from './supabase-auth-gateway'
export { createCollectionReplication, type Checkpoint } from './replication'
export { SyncManager, type SyncTarget } from './sync-manager'
export { SupabaseStorage } from './supabase-storage'
