import { describe, expect, it, vi } from 'vitest'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { applyDataTransition } from './apply-data-transition'

const TABLES: readonly SyncedTable[] = ['decks', 'cards']

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
    const watcher = { onChange: vi.fn(), onReconnect: vi.fn() }

    await applyDataTransition({
      transition: 'keep',
      userId: 'a',
      syncManager,
      tables: TABLES,
      dataOwner,
      resetLocal,
      watcher,
    })

    expect(syncManager.start).toHaveBeenCalledWith('a', TABLES, watcher)
    expect(dataOwner.claim).toHaveBeenCalledWith('a')
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('stops watching and wipes for a different account, pushing nothing into it', async () => {
    const { syncManager, dataOwner, resetLocal } = setup()

    await applyDataTransition({
      transition: 'reset',
      userId: 'b',
      syncManager,
      tables: TABLES,
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
      tables: TABLES,
      dataOwner,
      resetLocal,
    })

    expect(order).toEqual(['claim', 'reset'])
  })
})
