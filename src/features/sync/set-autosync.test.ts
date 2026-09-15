import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createSyncStateStore,
  DEFAULT_SYNC_STATE,
  selectAutosync,
  type SyncState,
} from '@/entities/sync-state'
import { setAutosync } from './set-autosync'

async function setup(state: Partial<SyncState> = {}) {
  const repo = new InMemoryRepository<SyncState>()
  await repo.save({ ...DEFAULT_SYNC_STATE, ...state })
  const syncStateStore = started(createSyncStateStore(repo))
  return { deps: { syncStateStore }, repo }
}

describe('setAutosync', () => {
  it('turns Autosync on for this device, keeping the rest of the state', async () => {
    const { deps, repo } = await setup({ lastSyncedAt: '2026-02-01T00:00:00Z' })

    await setAutosync(deps, true)

    expect(selectAutosync(deps.syncStateStore.getState())).toBe(true)
    expect(await repo.getById(DEFAULT_SYNC_STATE.id)).toMatchObject({
      autosync: true,
      lastSyncedAt: '2026-02-01T00:00:00Z',
    })
  })

  it('writes nothing when the answer is already the stored one', async () => {
    const { deps } = await setup({ autosync: true })
    const save = vi.spyOn(deps.syncStateStore.getState(), 'save')

    await setAutosync(deps, true)

    expect(save).not.toHaveBeenCalled()
  })
})
