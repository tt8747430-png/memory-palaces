import { describe, expect, it } from 'vitest'
import { CLOSED, deleteAccountReducer, type DeleteAccountStage } from './delete-account-machine'

const run = (...events: Parameters<typeof deleteAccountReducer>[1][]): DeleteAccountStage =>
  events.reduce(deleteAccountReducer, CLOSED)

describe('deleteAccountReducer', () => {
  it('synchronises first and only then asks for the word', () => {
    expect(run({ type: 'opened' })).toEqual({ kind: 'preparing' })
    expect(run({ type: 'opened' }, { type: 'prepared', readiness: { kind: 'ready' } })).toEqual({
      kind: 'confirm',
    })
  })

  it('cannot submit before the Sync has succeeded', () => {
    expect(run({ type: 'opened' }, { type: 'submitted' })).toEqual({ kind: 'preparing' })
  })

  it('stops with the reason when the device is not ready', () => {
    const failed = { kind: 'sync-failed' as const, reason: 'push refused' }
    expect(run({ type: 'opened' }, { type: 'prepared', readiness: failed })).toEqual({
      kind: 'problem',
      problem: 'sync-failed',
    })
    expect(run({ type: 'opened' }, { type: 'prepared', readiness: { kind: 'offline' } })).toEqual({
      kind: 'problem',
      problem: 'offline',
    })
  })

  it('gets out of the review dialog’s way when the Sync needs an answer', () => {
    expect(run({ type: 'opened' }, { type: 'prepared', readiness: { kind: 'needs-review' } })).toBe(
      CLOSED,
    )
  })

  it('closes once scheduled, and reports a failed request without closing', () => {
    const confirming = [
      { type: 'opened' },
      { type: 'prepared', readiness: { kind: 'ready' } },
      { type: 'submitted' },
    ] as const
    expect(run(...confirming)).toEqual({ kind: 'submitting' })
    expect(
      run(...confirming, { type: 'requested', result: { kind: 'scheduled', purgeAfter: 'x' } }),
    ).toBe(CLOSED)
    expect(
      run(...confirming, { type: 'requested', result: { kind: 'failed', reason: 'down' } }),
    ).toEqual({ kind: 'problem', problem: 'failed' })
  })

  it('stays open while the request is in flight', () => {
    const submitting = run(
      { type: 'opened' },
      { type: 'prepared', readiness: { kind: 'ready' } },
      { type: 'submitted' },
    )
    expect(deleteAccountReducer(submitting, { type: 'closed' })).toBe(submitting)
  })

  it('ignores a late answer for a sheet already closed', () => {
    const closed = run({ type: 'opened' }, { type: 'closed' })
    expect(deleteAccountReducer(closed, { type: 'prepared', readiness: { kind: 'ready' } })).toBe(
      closed,
    )
  })
})
