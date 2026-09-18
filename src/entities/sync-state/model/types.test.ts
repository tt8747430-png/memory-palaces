import { describe, expect, it } from 'vitest'
import {
  appendSyncLog,
  completeSyncState,
  DEFAULT_SYNC_STATE,
  SYNC_LOG_LIMIT,
  SYNC_STATE_ID,
  type SyncLogEntry,
  type SyncState,
} from './types'

describe('completeSyncState', () => {
  it('fills the fields a stored document predates, and keeps what it has', () => {
    const stored = { id: SYNC_STATE_ID, lastSyncedAt: '2026-02-01T00:00:00Z' } as SyncState

    expect(completeSyncState(stored)).toEqual({
      ...DEFAULT_SYNC_STATE,
      lastSyncedAt: '2026-02-01T00:00:00Z',
    })
  })

  it('pins the singleton id and a checkpoints map, whatever was stored', () => {
    const stored = { id: 'other', checkpoints: null, cloudChanged: true } as unknown as SyncState

    expect(completeSyncState(stored)).toMatchObject({
      id: SYNC_STATE_ID,
      checkpoints: {},
      cloudChanged: true,
    })
  })

  it('gives a stored document with no log an empty one', () => {
    const stored = { id: SYNC_STATE_ID, checkpoints: {}, cloudChanged: false } as SyncState
    expect(completeSyncState(stored).log).toEqual([])
  })
})

describe('appendSyncLog', () => {
  const entry = (at: string): SyncLogEntry => ({ at, outcome: 'clean', pushed: 0, pulled: 0 })

  it('puts the newest first and forgets the oldest past the limit', () => {
    let log: SyncLogEntry[] = []
    for (let i = 0; i <= SYNC_LOG_LIMIT; i += 1) log = appendSyncLog(log, entry(`t${i}`))
    expect(log).toHaveLength(SYNC_LOG_LIMIT)
    expect(log[0]?.at).toBe(`t${SYNC_LOG_LIMIT}`)
    expect(log.at(-1)?.at).toBe('t1')
  })
})
