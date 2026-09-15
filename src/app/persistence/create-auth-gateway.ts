import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthGateway } from '@/shared/api'
import { isSupabaseConfigured, supabase, SupabaseAuthGateway } from '@/shared/api/supabase'
import { LocalAuthGateway } from './local-auth-gateway'

export function createAuthGateway(
  configured: boolean = isSupabaseConfigured(),
  client: SupabaseClient = supabase,
): AuthGateway {
  return configured ? new SupabaseAuthGateway(client) : new LocalAuthGateway()
}
