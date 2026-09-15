import { describe, expect, it } from 'vitest'
import { INITIAL_RUNNER_STATE, runnerReducer } from './sync-runner-state'

const items = [{ collection: 'decks' as const, id: 'd1' }]
const rows = [{ ...items[0]!, label: 'Kanji' }]
const loading = { items, rows: { state: 'loading' as const } }

describe('runnerReducer', () => {
  it('shows progress while a Sync or a restore runs, clearing any earlier failure', () => {
    const failed = { phase: 'failed' as const, error: 'boom', review: null }
    expect(runnerReducer(failed, { type: 'started', phase: 'syncing' })).toEqual({
      phase: 'syncing',
      error: null,
      review: null,
    })
    expect(runnerReducer(INITIAL_RUNNER_STATE, { type: 'started', phase: 'restoring' }).phase).toBe(
      'restoring',
    )
  })

  it('settles every outcome the same way wherever it came from', () => {
    const syncing = runnerReducer(INITIAL_RUNNER_STATE, { type: 'started', phase: 'syncing' })
    const settle = (outcome: Parameters<typeof runnerReducer>[1] & { type: 'settled' }) =>
      runnerReducer(syncing, outcome)

    expect(settle({ type: 'settled', outcome: { kind: 'clean' } }).phase).toBe('synced')
    expect(settle({ type: 'settled', outcome: { kind: 'merged' } }).phase).toBe('synced')
    expect(settle({ type: 'settled', outcome: { kind: 'offline' } }).phase).toBe('idle')
    expect(settle({ type: 'settled', outcome: { kind: 'needs-review', items } })).toEqual({
      phase: 'idle',
      error: null,
      review: loading,
    })
    expect(settle({ type: 'settled', outcome: { kind: 'failed', reason: 'refused' } })).toEqual({
      phase: 'failed',
      error: 'refused',
      review: null,
    })
  })

  it('opens a review without touching the phase, and dismissing it applies nothing', () => {
    const open = runnerReducer(INITIAL_RUNNER_STATE, { type: 'reviewOpened', items })
    expect(open).toEqual({ phase: 'idle', error: null, review: loading })
    expect(runnerReducer(open, { type: 'dismissed' })).toEqual(INITIAL_RUNNER_STATE)
  })

  it('fills in the names once they arrive, or records that they did not', () => {
    const open = runnerReducer(INITIAL_RUNNER_STATE, { type: 'reviewOpened', items })

    expect(runnerReducer(open, { type: 'reviewDescribed', items, rows }).review).toEqual({
      items,
      rows: { state: 'ready', rows },
    })
    expect(runnerReducer(open, { type: 'reviewDescribeFailed', items }).review).toEqual({
      items,
      rows: { state: 'failed' },
    })
  })

  it('drops names that arrive for a review no longer open', () => {
    const open = runnerReducer(INITIAL_RUNNER_STATE, { type: 'reviewOpened', items })
    const dismissed = runnerReducer(open, { type: 'dismissed' })
    expect(runnerReducer(dismissed, { type: 'reviewDescribed', items, rows })).toBe(dismissed)

    const replaced = runnerReducer(open, { type: 'reviewOpened', items: [...items] })
    expect(runnerReducer(replaced, { type: 'reviewDescribed', items, rows })).toBe(replaced)
  })

  it('lets the success state clear itself, and nothing else', () => {
    const synced = { phase: 'synced' as const, error: null, review: null }
    expect(runnerReducer(synced, { type: 'acknowledged' }).phase).toBe('idle')
    const syncing = { phase: 'syncing' as const, error: null, review: null }
    expect(runnerReducer(syncing, { type: 'acknowledged' })).toBe(syncing)
  })
})
