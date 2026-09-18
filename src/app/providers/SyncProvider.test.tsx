import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import {
  type CloudSyncPort,
  InMemoryRepository,
  LocalObjectUrlStorage,
  type PersistedAuth,
  type StoragePort,
} from '@/shared/api'
import {
  AuthGatewayContext,
  type DataOwner,
  type SyncRunner,
  useSplashStore,
  useSyncRunner,
} from '@/shared/lib'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, DeckStoreContext } from '@/entities/deck'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { DEFAULT_PREFERENCES, PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import { setExtensionEnabled } from '@/features/preferences'
import { CORE_SYNC_TABLES, type SyncTableSpec } from '@/shared/config/sync-tables'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import {
  createPendingChangeStore,
  makePendingChange,
  type PendingChange,
  PendingChangeStoreContext,
} from '@/entities/pending-change'
import {
  createSyncStateStore,
  DEFAULT_SYNC_STATE,
  type SyncState,
  SyncStateStoreContext,
} from '@/entities/sync-state'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { SyncProvider } from './SyncProvider'

const account: PersistedAuth = { id: 'u1', kind: 'account' }

/** A contributed table alongside the core ones, so a toggle actually changes the live set. */
const BIBLE_TABLE: SyncTableSpec = {
  table: 'bible_verses',
  collectionKey: 'bibleVerses',
  owner: 'bible',
}
const ALL_TABLES: readonly SyncTableSpec[] = [...CORE_SYNC_TABLES, BIBLE_TABLE]
const CORE_TABLE_NAMES = CORE_SYNC_TABLES.map((spec) => spec.table)
const otherAccount: PersistedAuth = { id: 'u2', kind: 'account' }
const guest: PersistedAuth = { id: 'g1', kind: 'guest' }
const storage: StoragePort = new LocalObjectUrlStorage()
const SYNCED_BEFORE = '2026-09-01T00:00:00.000Z'

/** The app is already open — its intro played, its services built — as when a learner signs in. */
function openApp() {
  useSplashStore.setState({ holds: new Set() })
}

const splashHolds = () => useSplashStore.getState().holds

afterEach(() => {
  cleanup()
  setVisibility('visible')
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  useSplashStore.setState(useSplashStore.getInitialState(), true)
})

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true })
}

function manager() {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  }
}

function cloud(): CloudSyncPort & { [K in keyof CloudSyncPort]: ReturnType<typeof vi.fn> } {
  return {
    peek: vi.fn().mockResolvedValue([]),
    parents: vi.fn().mockResolvedValue([]),
    fetch: vi.fn().mockResolvedValue([]),
    runCycle: vi.fn().mockResolvedValue({}),
  }
}

function owner(initial: string | null = null): DataOwner {
  let current = initial
  return {
    read: () => current,
    claim: (userId) => {
      current = userId
    },
  }
}

interface Options {
  syncManager?: ReturnType<typeof manager> | null
  cloudSync?: ReturnType<typeof cloud> | null
  auth: PersistedAuth | null
  resetLocal?: () => Promise<void>
  dataOwner?: DataOwner
  autosync?: boolean
  /** When this device last completed a Sync — a device that has synced before, unless null. */
  lastSyncedAt?: string | null
  pending?: number
  pendingReady?: boolean
  extensions?: string[]
}

function Probe({ onRunner }: { onRunner: (runner: SyncRunner | null) => void }) {
  const runner = useSyncRunner()
  useEffect(() => onRunner(runner), [runner, onRunner])
  return null
}

async function stores({
  autosync = DEFAULT_PREFERENCES.autosync,
  lastSyncedAt = SYNCED_BEFORE,
  pending = 0,
  pendingReady = true,
  extensions = [],
}: Options) {
  const syncStateRepo = new InMemoryRepository<SyncState>([{ ...DEFAULT_SYNC_STATE, lastSyncedAt }])
  const pendingRepo = new InMemoryRepository<PendingChange>(
    Array.from({ length: pending }, (_, i) =>
      makePendingChange({ table: 'decks', entityId: `d${i}`, op: 'save', at: 't' }),
    ),
  )
  const pendingStore = createPendingChangeStore(pendingRepo)

  return {
    preferences: preferencesStoreHolding({ extensions, autosync }),
    syncState: started(createSyncStateStore(syncStateRepo)),
    pending: pendingReady ? started(pendingStore) : pendingStore,
    gateway: new LocalAuthGateway(),
    session: createSessionStore(new InMemoryRepository<Session>()),
    deck: createDeckStore(new InMemoryRepository<Deck>()),
    card: createCardStore(new InMemoryRepository<Card>()),
    folder: createFolderStore(new InMemoryRepository<Folder>()),
    question: createQuestionStore(new InMemoryRepository<Question>()),
    profile: createProfileStore(new InMemoryRepository<Profile>()),
  }
}

type Stores = Awaited<ReturnType<typeof stores>>

function tree(options: Options, s: Stores, onRunner: (runner: SyncRunner | null) => void) {
  const {
    syncManager = manager(),
    cloudSync = cloud(),
    auth,
    resetLocal = () => Promise.resolve(),
    dataOwner = owner(),
  } = options
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={s.gateway}>
        <SessionStoreContext value={s.session}>
          <DeckStoreContext value={s.deck}>
            <CardStoreContext value={s.card}>
              <FolderStoreContext value={s.folder}>
                <QuestionStoreContext value={s.question}>
                  <ProfileStoreContext value={s.profile}>
                    <PreferencesStoreContext value={s.preferences}>
                      <PendingChangeStoreContext value={s.pending}>
                        <SyncStateStoreContext value={s.syncState}>
                          {children}
                        </SyncStateStoreContext>
                      </PendingChangeStoreContext>
                    </PreferencesStoreContext>
                  </ProfileStoreContext>
                </QuestionStoreContext>
              </FolderStoreContext>
            </CardStoreContext>
          </DeckStoreContext>
        </SessionStoreContext>
      </AuthGatewayContext>
    </I18nextProvider>
  )
  return wrap(
    <SyncProvider
      syncManager={syncManager}
      cloudSync={cloudSync}
      auth={auth}
      resetLocal={resetLocal}
      storage={storage}
      syncTables={ALL_TABLES}
      dataOwner={dataOwner}
    >
      <Probe onRunner={onRunner} />
    </SyncProvider>,
  )
}

async function mount(options: Options) {
  const s = await stores(options)
  let runner: SyncRunner | null = null
  const onRunner = (next: SyncRunner | null) => {
    runner = next
  }
  const view = render(tree(options, s, onRunner))
  return {
    ...view,
    stores: s,
    runner: () => runner,
    rerenderWith: (next: Options) => view.rerender(tree(next, s, onRunner)),
  }
}

describe('SyncProvider', () => {
  it('watches the cloud for the signed-in account without replicating anything', async () => {
    const syncManager = manager()
    const cloudSync = cloud()
    await mount({ syncManager, cloudSync, auth: account })

    await waitFor(() =>
      expect(syncManager.start).toHaveBeenCalledWith('u1', CORE_TABLE_NAMES, expect.any(Object)),
    )
    expect(cloudSync.runCycle).not.toHaveBeenCalled()
  })

  it('restarts the watcher when an extension is switched on, so its table joins', async () => {
    const syncManager = manager()
    const view = await mount({ syncManager, auth: account })
    await waitFor(() =>
      expect(syncManager.start).toHaveBeenLastCalledWith(
        'u1',
        CORE_TABLE_NAMES,
        expect.any(Object),
      ),
    )

    await act(async () => {
      await setExtensionEnabled(view.stores.preferences, 'bible', true)
    })

    await waitFor(() =>
      expect(syncManager.start).toHaveBeenLastCalledWith(
        'u1',
        [...CORE_TABLE_NAMES, 'bible_verses'],
        expect.any(Object),
      ),
    )
    expect(syncManager.stop).toHaveBeenCalled()
  })

  it('drops the table again when the extension is switched off', async () => {
    const syncManager = manager()
    const view = await mount({ syncManager, auth: account })
    await act(async () => {
      await setExtensionEnabled(view.stores.preferences, 'bible', true)
    })
    await waitFor(() =>
      expect(syncManager.start).toHaveBeenLastCalledWith(
        'u1',
        [...CORE_TABLE_NAMES, 'bible_verses'],
        expect.any(Object),
      ),
    )

    await act(async () => {
      await setExtensionEnabled(view.stores.preferences, 'bible', false)
    })

    await waitFor(() =>
      expect(syncManager.start).toHaveBeenLastCalledWith(
        'u1',
        CORE_TABLE_NAMES,
        expect.any(Object),
      ),
    )
  })

  it('does nothing for a guest — their data stays on-device until they sign up', async () => {
    const syncManager = manager()
    await mount({ syncManager, auth: guest })

    expect(syncManager.start).not.toHaveBeenCalled()
  })

  it('does nothing when Supabase is not configured', async () => {
    await expect(mount({ syncManager: null, cloudSync: null, auth: account })).resolves.toBeTruthy()
  })

  describe('with Autosync turned off', () => {
    it('asks the cloud nothing on reconnect, on focus, on backgrounding or on pagehide', async () => {
      const cloudSync = cloud()
      await mount({ cloudSync, auth: account, autosync: false })

      window.dispatchEvent(new Event('online'))
      document.dispatchEvent(new Event('visibilitychange'))
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('pagehide'))

      expect(cloudSync.peek).not.toHaveBeenCalled()
      expect(cloudSync.runCycle).not.toHaveBeenCalled()
    })
  })

  describe('with Autosync on', () => {
    it('runs on the default a new device is given, with nothing turned on first', async () => {
      const cloudSync = cloud()
      const { runner } = await mount({ cloudSync, auth: account })
      await waitFor(() => expect(runner()).not.toBeNull())

      window.dispatchEvent(new Event('online'))

      await waitFor(() => expect(cloudSync.runCycle).toHaveBeenCalled())
    })

    it.each([
      ['a reconnect', () => window.dispatchEvent(new Event('online'))],
      ['returning to the app', () => document.dispatchEvent(new Event('visibilitychange'))],
      [
        'backgrounding the app',
        () => {
          setVisibility('hidden')
          document.dispatchEvent(new Event('visibilitychange'))
        },
      ],
      ['pagehide', () => window.dispatchEvent(new Event('pagehide'))],
    ])('runs a full Sync on %s — peeking before any push', async (_, trigger) => {
      const cloudSync = cloud()
      const { runner } = await mount({ cloudSync, auth: account, autosync: true })
      await waitFor(() => expect(runner()).not.toBeNull())

      trigger()

      await waitFor(() => expect(cloudSync.runCycle).toHaveBeenCalled())
      const peekedFirst =
        (cloudSync.peek.mock.invocationCallOrder[0] ?? Infinity) <
        (cloudSync.runCycle.mock.invocationCallOrder[0] ?? -Infinity)
      expect(peekedFirst).toBe(true)
    })
  })

  it('hands out no runner until the watcher is open for this account', async () => {
    let open: () => void = () => {}
    const syncManager = manager()
    syncManager.start.mockReturnValue(new Promise<void>((resolve) => (open = resolve)))
    const { runner } = await mount({ syncManager, auth: account })

    await waitFor(() => expect(syncManager.start).toHaveBeenCalled())
    expect(runner()).toBeNull()

    open()

    await waitFor(() => expect(runner()).not.toBeNull())
  })

  it('runs no Sync while the unsynced-reset question is up — even with Autosync on', async () => {
    const cloudSync = cloud()
    const syncManager = manager()
    const { runner, stores } = await mount({
      syncManager,
      cloudSync,
      auth: otherAccount,
      dataOwner: owner('u1'),
      pending: 3,
      autosync: true,
    })
    await screen.findByRole('alertdialog')

    window.dispatchEvent(new Event('online'))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(runner()).toBeNull()
    expect(syncManager.start).not.toHaveBeenCalled()
    expect(cloudSync.runCycle).not.toHaveBeenCalled()
    expect(stores.pending.getState().pendingChanges).toHaveLength(3)
  })

  it('reads the review’s names off the cloud once a Sync stops to ask', async () => {
    const cloudSync = cloud()
    cloudSync.peek.mockImplementation((table: string) =>
      Promise.resolve(
        table === 'decks' ? [{ id: 'd1', updated_at: '2026-02-01T00:00:00Z', deleted: false }] : [],
      ),
    )
    cloudSync.fetch.mockResolvedValue([{ id: 'd1', name: 'Kanji', _deleted: false }])
    const { runner, stores } = await mount({ cloudSync, auth: account, dataOwner: owner('u1') })
    await waitFor(() => expect(runner()).not.toBeNull())
    await stores.deck.getState().save({ id: 'd1' } as never)
    await stores.pending
      .getState()
      .save(makePendingChange({ table: 'decks', entityId: 'd1', op: 'remove', at: 't' }))

    await expect(runner()!.run()).resolves.toMatchObject({ kind: 'needs-review' })

    await waitFor(() =>
      expect(runner()!.review).toEqual({
        items: [{ collection: 'decks', id: 'd1' }],
        rows: { state: 'ready', rows: [{ collection: 'decks', id: 'd1', label: 'Kanji' }] },
      }),
    )
    expect(cloudSync.fetch).toHaveBeenCalledWith('decks', ['d1'])
  })

  it('records a failed load of the names, and fetches them again on request', async () => {
    const cloudSync = cloud()
    cloudSync.peek.mockImplementation((table: string) =>
      Promise.resolve(
        table === 'decks' ? [{ id: 'd1', updated_at: '2026-02-01T00:00:00Z', deleted: false }] : [],
      ),
    )
    cloudSync.fetch
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([{ id: 'd1', name: 'Kanji', _deleted: false }])
    const { runner, stores } = await mount({ cloudSync, auth: account, dataOwner: owner('u1') })
    await waitFor(() => expect(runner()).not.toBeNull())
    await stores.pending
      .getState()
      .save(makePendingChange({ table: 'decks', entityId: 'd1', op: 'remove', at: 't' }))

    await runner()!.openReview()
    await waitFor(() => expect(runner()!.review?.rows).toEqual({ state: 'failed' }))

    runner()!.reloadReview()

    await waitFor(() => expect(runner()!.review?.rows.state).toBe('ready'))
  })

  it('waits 4 s after the *last* write, so ten edits to one card are one Sync', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const cloudSync = cloud()
      const { runner, stores } = await mount({ cloudSync, auth: account, autosync: true })
      await waitFor(() => expect(runner()).not.toBeNull())
      const edit = (at: string) =>
        stores.pending
          .getState()
          .save(makePendingChange({ table: 'cards', entityId: 'c1', op: 'save', at }))

      await edit('t1')
      await vi.advanceTimersByTimeAsync(3000)
      await edit('t2')
      await vi.advanceTimersByTimeAsync(3000)
      expect(cloudSync.runCycle).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1100)
      await waitFor(() => expect(cloudSync.runCycle).toHaveBeenCalledTimes(1))
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops watching on unmount', async () => {
    const syncManager = manager()
    const { unmount } = await mount({ syncManager, auth: account })
    await waitFor(() => expect(syncManager.start).toHaveBeenCalled())

    unmount()

    expect(syncManager.stop).toHaveBeenCalled()
  })

  it('wipes without asking when a different account signs in and nothing was pending', async () => {
    const syncManager = manager()
    const resetLocal = vi.fn().mockResolvedValue(undefined)

    await mount({ syncManager, auth: otherAccount, resetLocal, dataOwner: owner('u1') })

    await waitFor(() => expect(resetLocal).toHaveBeenCalled())
    expect(syncManager.start).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('asks before erasing another account’s unsynchronised changes', async () => {
    const resetLocal = vi.fn().mockResolvedValue(undefined)

    await mount({ auth: otherAccount, resetLocal, dataOwner: owner('u1'), pending: 3 })

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('3 changes from another account')
    expect(resetLocal).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Erase and continue' }))

    await waitFor(() => expect(resetLocal).toHaveBeenCalled())
  })

  it('signs back out instead, when the person would rather keep them', async () => {
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const options: Options = {
      auth: otherAccount,
      resetLocal,
      dataOwner: owner('u1'),
      pending: 1,
    }
    const view = await mount(options)
    await screen.findByRole('alertdialog')

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    // The question follows who is signed in: signing out clears the session, and with it `auth`.
    view.rerenderWith({ ...options, auth: null })

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('keeps the data of the account that already owns this device', async () => {
    const syncManager = manager()
    const resetLocal = vi.fn().mockResolvedValue(undefined)

    await mount({ syncManager, auth: account, resetLocal, dataOwner: owner('u1'), pending: 2 })

    await waitFor(() =>
      expect(syncManager.start).toHaveBeenCalledWith('u1', CORE_TABLE_NAMES, expect.any(Object)),
    )
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('keeps the local data when a guest signs up — that is the claim', async () => {
    const syncManager = manager()
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const dataOwner = owner()
    const { rerenderWith } = await mount({ syncManager, auth: guest, resetLocal, dataOwner })

    rerenderWith({ syncManager, auth: account, resetLocal, dataOwner })

    await waitFor(() =>
      expect(syncManager.start).toHaveBeenCalledWith('u1', CORE_TABLE_NAMES, expect.any(Object)),
    )
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('asks the browser to keep the local database', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true })

    await mount({ auth: account })

    expect(persist).toHaveBeenCalled()
  })
})

describe('the first Sync on this device', () => {
  it('runs by itself for an account that never synced here, under the splash until it lands', async () => {
    openApp()
    const cloudSync = cloud()
    let land!: () => void
    cloudSync.runCycle.mockReturnValue(
      new Promise((resolve) => {
        land = () => resolve({})
      }),
    )
    const view = await mount({ cloudSync, auth: account, lastSyncedAt: null })

    await waitFor(() => expect(cloudSync.runCycle).toHaveBeenCalledTimes(1))
    expect(splashHolds()).toEqual(new Set(['first-sync', 'intro']))

    await act(async () => land())
    await waitFor(() => expect(splashHolds().has('first-sync')).toBe(false))
    expect(view.stores.syncState.getState().syncState?.lastSyncedAt).not.toBeNull()
  })

  it('lets the learner in at once when it is offline — Autosync pulls once it is back', async () => {
    openApp()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const cloudSync = cloud()
    const view = await mount({ cloudSync, auth: account, lastSyncedAt: null })

    await waitFor(() => expect(view.runner()).not.toBeNull())
    await waitFor(() => expect(splashHolds().has('first-sync')).toBe(false))
    expect(cloudSync.runCycle).not.toHaveBeenCalled()
  })

  it('lets the learner in when it fails, and does not try again under the splash', async () => {
    openApp()
    const cloudSync = cloud()
    cloudSync.runCycle.mockRejectedValue(new Error('server down'))
    const view = await mount({ cloudSync, auth: account, lastSyncedAt: null })

    await waitFor(() => expect(view.runner()?.phase).toBe('failed'))
    expect(splashHolds().has('first-sync')).toBe(false)
    expect(cloudSync.runCycle).toHaveBeenCalledTimes(1)
  })

  it('goes straight in where this account has synced before', async () => {
    openApp()
    const cloudSync = cloud()
    await mount({ cloudSync, auth: account })

    await waitFor(() => expect(cloudSync.peek).not.toHaveBeenCalled())
    expect(splashHolds().size).toBe(0)
    expect(cloudSync.runCycle).not.toHaveBeenCalled()
  })

  it('never holds for a guest — there is nothing to bring in', async () => {
    openApp()
    await mount({ auth: guest, lastSyncedAt: null })
    expect(splashHolds().size).toBe(0)
  })

  it('does not cover the question when unsynced work would be lost', async () => {
    openApp()
    await mount({
      auth: otherAccount,
      dataOwner: owner('u1'),
      pending: 3,
      lastSyncedAt: null,
    })
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(splashHolds().size).toBe(0)
  })
})
