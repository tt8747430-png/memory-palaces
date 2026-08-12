import { describe, expect, it, vi } from 'vitest'
import { claimGuestData } from './claim-guest-data'

function setup() {
  return {
    syncManager: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    },
    resetLocal: vi.fn().mockResolvedValue(undefined),
  }
}

describe('claimGuestData', () => {
  it('starts sync and keeps local data on preserve', async () => {
    const { syncManager, resetLocal } = setup()

    await claimGuestData({ transition: 'preserve', userId: 'a', syncManager, resetLocal })

    expect(syncManager.start).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('stops sync and wipes local data when a different account signs in', async () => {
    const { syncManager, resetLocal } = setup()

    await claimGuestData({ transition: 'reset', userId: 'b', syncManager, resetLocal })

    expect(syncManager.stop).toHaveBeenCalled()
    expect(resetLocal).toHaveBeenCalled()
    // The reset reloads the app; replication starts against the empty database on the way back up.
    expect(syncManager.start).not.toHaveBeenCalled()
  })

  it('just keeps syncing for the same account', async () => {
    const { syncManager, resetLocal } = setup()

    await claimGuestData({ transition: 'none', userId: 'a', syncManager, resetLocal })

    expect(syncManager.start).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })
})
