import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createSyncStateStore,
  DEFAULT_SYNC_STATE,
  selectSyncState,
  type SyncState,
} from '@/entities/sync-state'
import { noteCloudChange } from './note-cloud-change'

async function setup(state: Partial<SyncState> = {}) {
  const repo = new InMemoryRepository<SyncState>()
  await repo.save({ ...DEFAULT_SYNC_STATE, ...state })
  const syncStateStore = started(createSyncStateStore(repo))
  return {
    deps: { syncStateStore },
    flag: () => selectSyncState(syncStateStore.getState()).cloudChanged,
  }
}

const event = (updated_at: string, id = 'd1') => ({ table: 'decks' as const, id, updated_at })

describe('noteCloudChange', () => {
  it('raises the flag when the device has never synced — everything is ahead of nothing', async () => {
    const { deps, flag } = await setup()

    await noteCloudChange(deps, event('2026-02-01T00:00:00Z'))

    expect(flag()).toBe(true)
  })

  it('raises the flag for a write past this device’s checkpoint', async () => {
    const { deps, flag } = await setup({
      checkpoints: { decks: { updated_at: '2026-02-01T00:00:00Z', id: 'd1' } },
    })

    await noteCloudChange(deps, event('2026-02-02T00:00:00Z', 'd2'))

    expect(flag()).toBe(true)
  })

  it('ignores the echo of this device’s own push', async () => {
    const { deps, flag } = await setup({
      checkpoints: { decks: { updated_at: '2026-02-02T00:00:00Z', id: 'd9' } },
    })

    await noteCloudChange(deps, event('2026-02-01T00:00:00Z'))

    expect(flag()).toBe(false)
  })

  it('breaks a same-clock tie on the id, like the pull filter does', async () => {
    const { deps, flag } = await setup({
      checkpoints: { decks: { updated_at: '2026-02-01T00:00:00Z', id: 'd5' } },
    })

    await noteCloudChange(deps, event('2026-02-01T00:00:00Z', 'd4'))
    expect(flag()).toBe(false)

    await noteCloudChange(deps, event('2026-02-01T00:00:00Z', 'd6'))
    expect(flag()).toBe(true)
  })

  it('writes nothing once the flag is already up', async () => {
    const { deps } = await setup({ cloudChanged: true })
    const before = selectSyncState(deps.syncStateStore.getState())

    await noteCloudChange(deps, event('2026-02-01T00:00:00Z'))

    expect(selectSyncState(deps.syncStateStore.getState())).toBe(before)
  })
})
