import { describe, expect, it } from 'vitest'
import { DEFAULT_SYNC_STATE } from './types'
import {
  checkpointFor,
  selectCloudChanged,
  selectLastSyncedAt,
  selectSyncState,
} from './selectors'
import type { SyncStateState } from './store'

const at = { updated_at: '2026-02-01T00:00:00Z', id: 'd1' }
const held: SyncStateState = {
  syncState: {
    ...DEFAULT_SYNC_STATE,
    checkpoints: { decks: at, cards: null },
    cloudChanged: true,
    lastSyncedAt: '2026-02-02T00:00:00Z',
  },
  status: 'ready',
  start: () => {},
  stop: () => {},
  save: async (state) => state,
}
const empty: SyncStateState = { ...held, syncState: null }

describe('sync-state selectors', () => {
  it('reads the defaults until the first write — a new device has synced nothing', () => {
    expect(selectSyncState(empty)).toBe(DEFAULT_SYNC_STATE)
    expect(selectCloudChanged(empty)).toBe(false)
    expect(selectLastSyncedAt(empty)).toBeNull()
  })

  it('reads the stored document once there is one', () => {
    expect(selectCloudChanged(held)).toBe(true)
    expect(selectLastSyncedAt(held)).toBe('2026-02-02T00:00:00Z')
  })

  it('answers null for a table whose position is unknown, stored or never written', () => {
    expect(checkpointFor(selectSyncState(held), 'decks')).toEqual(at)
    expect(checkpointFor(selectSyncState(held), 'cards')).toBeNull()
    expect(checkpointFor(selectSyncState(held), 'history')).toBeNull()
  })
})
