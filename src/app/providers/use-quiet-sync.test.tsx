import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import type { SyncOutcome } from '@/shared/lib'
import { CORE_QUIET_TABLES, type SyncedTable } from '@/shared/config/sync-tables'
import { started } from '@/shared/test/started'
import {
  createPendingChangeStore,
  makePendingChange,
  type PendingChange,
  PendingChangeStoreContext,
} from '@/entities/pending-change'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import { useQuietSync } from './use-quiet-sync'
import { CLOUD_DEBOUNCE_MS, WRITE_DEBOUNCE_MS } from './use-quiet-fire'

function renderQuietSync({
  autosync = true,
  active = true,
  quiet = CORE_QUIET_TABLES,
}: { autosync?: boolean; active?: boolean; quiet?: readonly SyncedTable[] } = {}) {
  const pending = started(createPendingChangeStore(new InMemoryRepository<PendingChange>()))
  const preferences = preferencesStoreHolding({ autosync })
  const run = vi.fn(async (): Promise<SyncOutcome> => ({ kind: 'clean' }))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PendingChangeStoreContext value={pending}>
      <PreferencesStoreContext value={preferences}>{children}</PreferencesStoreContext>
    </PendingChangeStoreContext>
  )
  const hook = renderHook(
    ({ moved }: { moved: number }) => useQuietSync({ active, quiet, run, moved }),
    { wrapper, initialProps: { moved: 0 } },
  )
  const wrote = (table: SyncedTable, at: string) =>
    act(async () => {
      await pending.getState().save(makePendingChange({ table, entityId: 'x', op: 'save', at }))
    })
  return { ...hook, run, wrote }
}

const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

describe('useQuietSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pushes a changed setting without being asked', async () => {
    const { run, wrote } = renderQuietSync()
    await wrote('preferences', 't1')
    await tick(WRITE_DEBOUNCE_MS - 1)
    expect(run).not.toHaveBeenCalled()
    await tick(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('runs with Autosync off — that preference governs the learner’s work, not this', async () => {
    const { run, wrote } = renderQuietSync({ autosync: false })
    await wrote('preferences', 't1')
    await tick(WRITE_DEBOUNCE_MS)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('ignores a held write: a graded card is not news for this cycle', async () => {
    const { run, wrote } = renderQuietSync()
    await wrote('cards', 't1')
    await tick(WRITE_DEBOUNCE_MS)
    expect(run).not.toHaveBeenCalled()
  })

  it('waits out a burst, so ten taps on a toggle are one push', async () => {
    const { run, wrote } = renderQuietSync()
    await wrote('preferences', 't1')
    await tick(WRITE_DEBOUNCE_MS - 1000)
    await wrote('profiles', 't2')
    await tick(WRITE_DEBOUNCE_MS - 1000)
    expect(run).not.toHaveBeenCalled()
    await tick(1000)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('pulls when a quiet table is heard to move elsewhere', async () => {
    const { run, rerender } = renderQuietSync()
    rerender({ moved: 1 })
    await tick(CLOUD_DEBOUNCE_MS)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does nothing without an account to sync as', async () => {
    const { run, wrote } = renderQuietSync({ active: false })
    await wrote('preferences', 't1')
    await tick(WRITE_DEBOUNCE_MS)
    expect(run).not.toHaveBeenCalled()
  })

  it('does nothing when no table is quiet', async () => {
    const { run, wrote } = renderQuietSync({ quiet: [] })
    await wrote('preferences', 't1')
    await tick(WRITE_DEBOUNCE_MS)
    expect(run).not.toHaveBeenCalled()
  })
})
