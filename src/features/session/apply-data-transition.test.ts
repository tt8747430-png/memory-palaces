import { describe, expect, it, vi } from 'vitest'
import { applyDataTransition } from './apply-data-transition'

function setup() {
  return {
    syncManager: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
    },
    dataOwner: { read: vi.fn().mockReturnValue(null), claim: vi.fn() },
    resetLocal: vi.fn().mockResolvedValue(undefined),
    onUnsyncedLoss: vi.fn(),
  }
}

describe('applyDataTransition', () => {
  it('starts sync and keeps local data on keep — that is the guest claim', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()

    await applyDataTransition({
      transition: 'keep',
      userId: 'a',
      syncManager,
      dataOwner,
      resetLocal,
    })

    expect(syncManager.start).toHaveBeenCalledWith('a')
    expect(dataOwner.claim).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('pushes the outgoing account’s work before wiping it', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()
    const order: string[] = []
    syncManager.flush.mockImplementation(async () => void order.push('flush'))
    resetLocal.mockImplementation(async () => void order.push('reset'))

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      dataOwner,
      resetLocal,
    })

    expect(order).toEqual(['flush', 'reset'])
    expect(syncManager.stop).toHaveBeenCalled()
  })

  it('claims the device before the wipe reloads the page', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()
    const order: string[] = []
    dataOwner.claim.mockImplementation(() => void order.push('claim'))
    resetLocal.mockImplementation(async () => void order.push('reset'))

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      dataOwner,
      resetLocal,
    })

    // Reloading still owned by the previous account would wipe the incoming one all over again.
    expect(order).toEqual(['claim', 'reset'])
  })

  it('still wipes when the flush fails, but says what was lost', async () => {
    const { syncManager, dataOwner, resetLocal, onUnsyncedLoss } = setup()
    syncManager.flush.mockRejectedValue(new Error('offline'))

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      dataOwner,
      resetLocal,
      onUnsyncedLoss,
    })

    // Leaving the previous account's decks behind would sync them into this one.
    expect(resetLocal).toHaveBeenCalled()
    expect(onUnsyncedLoss).toHaveBeenCalled()
  })
})
