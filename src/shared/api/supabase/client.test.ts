import { describe, expect, it } from 'vitest'
import { isSupabaseConfigured, supabase } from './client'

describe('isSupabaseConfigured', () => {
  it('is false when env vars are absent', () => {
    // The vitest env sets neither VITE_SUPABASE_URL nor VITE_SUPABASE_PUBLISHABLE_KEY, so the
    // app must fall back to local auth with no sync — exactly how offline dev runs.
    expect(isSupabaseConfigured()).toBe(false)
  })

  it('still exposes a client so unconfigured imports never crash', () => {
    expect(supabase.auth).toBeDefined()
  })
})
