import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import type { SyncOutcome } from '@/shared/lib'
import { started } from '@/shared/test/started'
import {
  createPendingChangeStore,
  makePendingChange,
  type PendingChange,
  PendingChangeStoreContext,
} from '@/entities/pending-change'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import {
  createSyncStateStore,
  DEFAULT_SYNC_STATE,
  type SyncState,
  SyncStateStoreContext,
} from '@/entities/sync-state'
import { CORE_HELD_TABLES } from '@/shared/config/sync-tables'
import { RETRY_DELAYS_MS, useAutosync } from './use-autosync'
import { CLOUD_DEBOUNCE_MS, WRITE_DEBOUNCE_MS } from './use-quiet-fire'

function renderAutosync({
  autosync = true,
  active = true,
  outcomes = [{ kind: 'clean' } as SyncOutcome],
}: { autosync?: boolean; active?: boolean; outcomes?: SyncOutcome[] } = {}) {
  const syncState = started(
    createSyncStateStore(new InMemoryRepository<SyncState>([{ ...DEFAULT_SYNC_STATE }])),
  )
  const pending = started(createPendingChangeStore(new InMemoryRepository<PendingChange>()))
  const preferences = preferencesStoreHolding({ autosync })
  const results = [...outcomes]
  // A cycle that lands settles `cloudChanged`, as `syncNow` does; a failed one leaves it be.
  const run = vi.fn(async () => {
    const outcome = results.length > 1 ? results.shift()! : results[0]!
    if (outcome.kind !== 'failed') {
      await syncState.getState().save({ ...DEFAULT_SYNC_STATE, cloudChanged: false })
    }
    return outcome
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SyncStateStoreContext value={syncState}>
      <PendingChangeStoreContext value={pending}>
        <PreferencesStoreContext value={preferences}>{children}</PreferencesStoreContext>
      </PendingChangeStoreContext>
    </SyncStateStoreContext>
  )
  const hook = renderHook(
    ({ reconnects }: { reconnects: number }) =>
      useAutosync({ active, held: CORE_HELD_TABLES, run, reconnects }),
    { wrapper, initialProps: { reconnects: 0 } },
  )
  const cloudMoved = () =>
    act(async () => {
      await syncState.getState().save({ ...DEFAULT_SYNC_STATE, cloudChanged: true })
    })
  const wrote = (at: string) =>
    act(async () => {
      await pending
        .getState()
        .save(makePendingChange({ table: 'cards', entityId: 'c1', op: 'save', at }))
    })
  return { ...hook, run, cloudMoved, wrote }
}

const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

describe('useAutosync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pulls when the cloud is heard to move — the other device need not wait', async () => {
    const { run, cloudMoved } = renderAutosync()
    await cloudMoved()
    await tick(CLOUD_DEBOUNCE_MS - 1)
    expect(run).not.toHaveBeenCalled()
    await tick(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('pulls when the watcher comes back after a drop', async () => {
    const { run, rerender } = renderAutosync()
    rerender({ reconnects: 1 })
    await tick(CLOUD_DEBOUNCE_MS)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('waits after the last local write, so a burst of edits is one Sync', async () => {
    const { run, wrote } = renderAutosync()
    await wrote('t1')
    await tick(WRITE_DEBOUNCE_MS - 1000)
    await wrote('t2')
    await tick(WRITE_DEBOUNCE_MS - 1000)
    expect(run).not.toHaveBeenCalled()
    await tick(1000)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('tries a failed cycle again on the ladder, and stops climbing once one succeeds', async () => {
    const { run, cloudMoved } = renderAutosync({
      outcomes: [
        { kind: 'failed', reason: 'x' },
        { kind: 'failed', reason: 'x' },
        { kind: 'clean' },
        { kind: 'failed', reason: 'x' },
        { kind: 'clean' },
      ],
    })
    await cloudMoved()
    await tick(CLOUD_DEBOUNCE_MS)
    expect(run).toHaveBeenCalledTimes(1)

    await tick(RETRY_DELAYS_MS[0]!)
    expect(run).toHaveBeenCalledTimes(2)
    await tick(RETRY_DELAYS_MS[0]!)
    expect(run).toHaveBeenCalledTimes(2)
    await tick(RETRY_DELAYS_MS[1]! - RETRY_DELAYS_MS[0]!)
    expect(run).toHaveBeenCalledTimes(3)

    // The third run succeeded: nothing is scheduled, and the next failure starts over.
    await tick(RETRY_DELAYS_MS[2]!)
    expect(run).toHaveBeenCalledTimes(3)
    await cloudMoved()
    await tick(CLOUD_DEBOUNCE_MS)
    expect(run).toHaveBeenCalledTimes(4)
    await tick(RETRY_DELAYS_MS[0]!)
    expect(run).toHaveBeenCalledTimes(5)
  })

  it('does not retry while offline or in the background — the events that end that run a Sync', async () => {
    const { run, cloudMoved } = renderAutosync({ outcomes: [{ kind: 'failed', reason: 'x' }] })
    await cloudMoved()
    await tick(CLOUD_DEBOUNCE_MS)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    await tick(RETRY_DELAYS_MS[0]!)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does nothing with Autosync off', async () => {
    const { run, cloudMoved, wrote, rerender } = renderAutosync({ autosync: false })
    await cloudMoved()
    await wrote('t1')
    rerender({ reconnects: 1 })
    window.dispatchEvent(new Event('online'))
    await tick(WRITE_DEBOUNCE_MS)
    expect(run).not.toHaveBeenCalled()
  })
})
