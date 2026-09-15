import { describe, expect, it, vi } from 'vitest'
import { applyDataTransition } from './apply-data-transition'

function setup() {
  return {
    syncManager: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    },
    dataOwner: { read: vi.fn().mockReturnValue(null), claim: vi.fn() },
    resetLocal: vi.fn().mockResolvedValue(undefined),
  }
}

describe('applyDataTransition', () => {
  it('starts watching and keeps local data on keep — that is the guest claim', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()
    const onRemoteChange = vi.fn()

    await applyDataTransition({
      transition: 'keep',
      userId: 'a',
      syncManager,
      dataOwner,
      resetLocal,
      onRemoteChange,
    })

    expect(syncManager.start).toHaveBeenCalledWith('a', onRemoteChange)
    expect(dataOwner.claim).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('stops watching and wipes for a different account, pushing nothing into it', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      dataOwner,
      resetLocal,
    })

    expect(syncManager.stop).toHaveBeenCalled()
    expect(syncManager.start).not.toHaveBeenCalled()
    expect(resetLocal).toHaveBeenCalled()
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
})
