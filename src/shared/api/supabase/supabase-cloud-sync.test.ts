import { describe, expect, it, vi } from 'vitest'
import { createSupabaseCloudSync } from './supabase-cloud-sync'

describe('createSupabaseCloudSync', () => {
  it('runs the cycle the manager owns and reports what it pushed', async () => {
    const runCycle = vi.fn().mockResolvedValue({ decks: ['d1'] })
    const cloud = createSupabaseCloudSync({} as never, { runCycle })

    await expect(cloud.runCycle()).resolves.toEqual({ decks: ['d1'] })
    expect(runCycle).toHaveBeenCalled()
  })
})
