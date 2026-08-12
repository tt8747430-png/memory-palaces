import { describe, expect, it, vi } from 'vitest'
import { applyDataTransition } from './apply-data-transition'

function setup() {
  return {
    syncManager: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
    },
    resetLocal: vi.fn().mockResolvedValue(undefined),
    onUnsyncedLoss: vi.fn(),
  }
}

describe('applyDataTransition', () => {
  it('starts sync and keeps local data on preserve — that is the guest claim', async () => {
    const { syncManager, resetLocal } = setup()

    await applyDataTransition({ transition: 'preserve', userId: 'a', syncManager, resetLocal })

    expect(syncManager.start).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('pushes the outgoing account’s work before wiping it', async () => {
    const { syncManager, resetLocal } = setup()
    const order: string[] = []
    syncManager.flush.mockImplementation(async () => void order.push('flush'))
    resetLocal.mockImplementation(async () => void order.push('reset'))

    await applyDataTransition({ transition: 'reset', userId: 'b', syncManager, resetLocal })

    expect(order).toEqual(['flush', 'reset'])
    expect(syncManager.stop).toHaveBeenCalled()
  })

  it('still wipes when the flush fails, but says what was lost', async () => {
    const { syncManager, resetLocal, onUnsyncedLoss } = setup()
    syncManager.flush.mockRejectedValue(new Error('offline'))

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      resetLocal,
      onUnsyncedLoss,
    })

    // Leaving the previous account's decks behind would sync them into this one.
    expect(resetLocal).toHaveBeenCalled()
    expect(onUnsyncedLoss).toHaveBeenCalled()
  })

  it('just keeps syncing for the same account', async () => {
    const { syncManager, resetLocal } = setup()

    await applyDataTransition({ transition: 'none', userId: 'a', syncManager, resetLocal })

    expect(syncManager.start).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })
})
