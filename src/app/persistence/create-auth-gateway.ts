import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthGateway } from '@/shared/api'
import { isSupabaseConfigured, supabase, SupabaseAuthGateway } from '@/shared/api/supabase'
import { LocalAuthGateway } from './local-auth-gateway'

/**
 * With no Supabase project configured the app runs exactly as it did before the cloud existed:
 * local identity, no sync. The arguments exist so the choice is testable without env juggling.
 */
export function createAuthGateway(
  configured: boolean = isSupabaseConfigured(),
  client: SupabaseClient = supabase,
): AuthGateway {
  return configured ? new SupabaseAuthGateway(client) : new LocalAuthGateway()
}
