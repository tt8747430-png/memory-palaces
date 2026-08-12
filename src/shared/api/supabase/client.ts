import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

/** Both halves are required: a URL with no key cannot authenticate, and a key with no URL has
 *  nowhere to go. Pure so the decision is testable without touching the environment. */
export const isConfigured = (url: string, key: string): boolean => Boolean(url) && Boolean(key)

export const isSupabaseConfigured = (): boolean =>
  isConfigured(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

/**
 * Single shared client. PKCE is required for the Google/Apple web OAuth flows;
 * `detectSessionInUrl` auto-exchanges the `?code=` on the /auth/callback landing.
 *
 * The placeholders keep the module importable when Supabase is not configured — the composition
 * root gates on `isSupabaseConfigured()`, so an unconfigured client is never called.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
