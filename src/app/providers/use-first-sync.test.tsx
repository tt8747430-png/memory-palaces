import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { type SyncOutcome, useSplashStore } from '@/shared/lib'
import { started } from '@/shared/test/started'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import {
  createSyncStateStore,
  DEFAULT_SYNC_STATE,
  type SyncState,
  SyncStateStoreContext,
} from '@/entities/sync-state'
import { FIRST_SYNC_BUDGET_MS, type FirstSyncDeps, useFirstSync } from './use-first-sync'

const CORE: readonly SyncedTable[] = ['decks', 'preferences']
const WITH_BIBLE: readonly SyncedTable[] = [...CORE, 'bible_verses']

const holds = () => useSplashStore.getState().holds

/** A launch: the splash is up for its intro, boot and the session, and boot has finished. */
function launch() {
  useSplashStore.setState(useSplashStore.getInitialState(), true)
  useSplashStore.getState().release('boot')
}

/** The app already open, as when a learner signs in. */
function openApp() {
  useSplashStore.setState({ holds: new Set() })
}

function deferred() {
  let resolve!: (outcome: SyncOutcome) => void
  const promise = new Promise<SyncOutcome>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderFirstSync(
  deps: Partial<FirstSyncDeps>,
  {
    lastSyncedAt = null,
    autosync = true,
  }: { lastSyncedAt?: string | null; autosync?: boolean } = {},
) {
  const syncState = started(
    createSyncStateStore(
      new InMemoryRepository<SyncState>([{ ...DEFAULT_SYNC_STATE, lastSyncedAt }]),
    ),
  )
  const preferences = preferencesStoreHolding({ autosync })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SyncStateStoreContext value={syncState}>
      <PreferencesStoreContext value={preferences}>{children}</PreferencesStoreContext>
    </SyncStateStoreContext>
  )
  const run = deps.run ?? vi.fn(() => Promise.resolve<SyncOutcome>({ kind: 'clean' }))
  const initial: FirstSyncDeps = {
    account: 'u1',
    canSync: true,
    transition: 'settled',
    tables: CORE,
    run,
    ...deps,
  }
  const view = renderHook((props: FirstSyncDeps) => useFirstSync(props), {
    wrapper,
    initialProps: initial,
  })
  return { ...view, run, initial }
}

afterEach(() => {
  vi.useRealTimers()
  useSplashStore.setState(useSplashStore.getInitialState(), true)
})

describe('useFirstSync', () => {
  it.each<SyncOutcome['kind']>(['clean', 'merged', 'offline', 'failed'])(
    'lets the learner in when the cycle ends %s',
    async (kind) => {
      openApp()
      const cycle = deferred()
      const { run } = renderFirstSync({ run: vi.fn(() => cycle.promise) })
      expect(holds().has('first-sync')).toBe(true)

      await act(async () => cycle.resolve({ kind } as SyncOutcome))
      expect(holds().has('first-sync')).toBe(false)
      expect(run).toHaveBeenCalledTimes(1)
    },
  )

  it('lets the learner in to answer a question the cycle raised', async () => {
    openApp()
    const cycle = deferred()
    renderFirstSync({ run: vi.fn(() => cycle.promise) })
    await act(async () => cycle.resolve({ kind: 'needs-review', items: [] }))
    expect(holds().has('first-sync')).toBe(false)
  })

  it('lets the learner in when the cycle throws', async () => {
    openApp()
    renderFirstSync({ run: vi.fn(() => Promise.reject(new Error('boom'))) })
    await waitFor(() => expect(holds().has('first-sync')).toBe(false))
  })

  it('stops holding the splash after its budget — the cycle carries on under the banner', async () => {
    vi.useFakeTimers()
    openApp()
    renderFirstSync({ run: vi.fn(() => new Promise<SyncOutcome>(() => {})) })
    expect(holds().has('first-sync')).toBe(true)

    act(() => vi.advanceTimersByTime(FIRST_SYNC_BUDGET_MS))
    expect(holds().has('first-sync')).toBe(false)
  })

  it('runs a second cycle when the pulled preferences switch an extension on', async () => {
    openApp()
    const first = deferred()
    const run = vi.fn(() => first.promise)
    const { rerender, initial } = renderFirstSync({ run })

    // The first cycle pulls preferences with Bible on: the live tables widen, and the watcher
    // restarts over them — no cycle can run until it is back.
    rerender({ ...initial, tables: WITH_BIBLE, canSync: false })
    await act(async () => first.resolve({ kind: 'merged' }))
    expect(holds().has('first-sync')).toBe(true)
    expect(run).toHaveBeenCalledTimes(1)

    run.mockResolvedValue({ kind: 'clean' })
    rerender({ ...initial, tables: WITH_BIBLE, canSync: true })
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(holds().has('first-sync')).toBe(false))
  })

  it('does nothing with Autosync off — nothing leaves the device until the learner asks', () => {
    openApp()
    const { run } = renderFirstSync({}, { autosync: false })
    expect(run).not.toHaveBeenCalled()
    expect(holds().size).toBe(0)
  })

  it('goes straight in where this account has synced before', () => {
    openApp()
    const { run } = renderFirstSync({}, { lastSyncedAt: '2026-09-01T00:00:00.000Z' })
    expect(run).not.toHaveBeenCalled()
    expect(holds().size).toBe(0)
  })

  it('keeps a cold launch covered until it knows — the splash never drops and comes back', () => {
    launch()
    useSplashStore.getState().release('intro')
    const { rerender, initial } = renderFirstSync({ account: undefined, canSync: false })
    expect(holds()).toEqual(new Set(['session']))

    // Restored: an account whose first Sync is due. It takes over before the session lets go.
    rerender({ ...initial, account: 'u1' })
    expect(holds()).toEqual(new Set(['first-sync']))
  })

  it('lets a cold launch in once it knows no first Sync is due', () => {
    launch()
    const { rerender, initial } = renderFirstSync({ account: undefined })
    rerender({ ...initial, account: null })
    expect(holds().has('session')).toBe(false)
  })

  it('does not hold while the learner is being asked about unsynced work', () => {
    launch()
    renderFirstSync({ transition: 'asking' })
    expect(holds().has('first-sync')).toBe(false)
    expect(holds().has('session')).toBe(false)
  })

  it('lets go when the learner signs out mid-sync', () => {
    openApp()
    const { rerender, initial } = renderFirstSync({
      run: vi.fn(() => new Promise<SyncOutcome>(() => {})),
    })
    expect(holds().has('first-sync')).toBe(true)
    rerender({ ...initial, account: null })
    expect(holds().has('first-sync')).toBe(false)
  })
})
