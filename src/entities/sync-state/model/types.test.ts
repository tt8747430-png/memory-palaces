import { describe, expect, it } from 'vitest'
import { completeSyncState, DEFAULT_SYNC_STATE, SYNC_STATE_ID, type SyncState } from './types'

describe('completeSyncState', () => {
  it('fills the fields a stored document predates, and keeps what it has', () => {
    const stored = { id: SYNC_STATE_ID, lastSyncedAt: '2026-02-01T00:00:00Z' } as SyncState

    expect(completeSyncState(stored)).toEqual({
      ...DEFAULT_SYNC_STATE,
      lastSyncedAt: '2026-02-01T00:00:00Z',
    })
  })

  it('pins the singleton id and a checkpoints map, whatever was stored', () => {
    const stored = { id: 'other', checkpoints: null, autosync: true } as unknown as SyncState

    expect(completeSyncState(stored)).toMatchObject({
      id: SYNC_STATE_ID,
      checkpoints: {},
      autosync: true,
    })
  })
})
