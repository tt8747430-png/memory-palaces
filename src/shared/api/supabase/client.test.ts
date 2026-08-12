import { describe, expect, it } from 'vitest'
import { isConfigured, isSupabaseConfigured, supabase } from './client'

describe('isConfigured', () => {
  it('needs both halves — a URL cannot authenticate and a key has nowhere to go', () => {
    expect(isConfigured('https://x.supabase.co', 'sb_publishable_x')).toBe(true)
    expect(isConfigured('https://x.supabase.co', '')).toBe(false)
    expect(isConfigured('', 'sb_publishable_x')).toBe(false)
    expect(isConfigured('', '')).toBe(false)
  })
})

describe('isSupabaseConfigured', () => {
  it('is false in the test environment, which is pinned to the offline path', () => {
    // vite.config.ts blanks the two vars for the unit suite, so a developer's .env.local cannot
    // change what is under test — or point these tests at a real project.
    expect(isSupabaseConfigured()).toBe(false)
  })

  it('still exposes a client so unconfigured imports never crash', () => {
    expect(supabase.auth).toBeDefined()
  })
})
