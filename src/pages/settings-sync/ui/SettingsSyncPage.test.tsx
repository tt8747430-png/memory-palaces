import { CORE_HELD_TABLES, CORE_QUIET_TABLES, SYNCED_TABLES } from '@/shared/config/sync-tables'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { type SyncRunner, SyncRunnerContext } from '@/shared/lib'
import { started } from '@/shared/test/started'
import {
  createSessionStore,
  makeAccountSession,
  makeGuestSession,
  type Session,
  SessionStoreContext,
} from '@/entities/session'
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
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { SettingsSyncPage } from './SettingsSyncPage'

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

const AT = '2026-01-01T00:00:00.000Z'

const runner = (overrides: Partial<SyncRunner> = {}): SyncRunner => ({
  phase: 'idle',
  error: null,
  review: null,
  tables: SYNCED_TABLES,
  held: CORE_HELD_TABLES,
  quiet: CORE_QUIET_TABLES,
  labelKeys: {},
  run: vi.fn().mockResolvedValue({ kind: 'clean' }),
  restore: vi.fn().mockResolvedValue({ kind: 'clean' }),
  repair: vi.fn().mockResolvedValue({ kind: 'clean' }),
  openReview: vi.fn().mockResolvedValue({ kind: 'clean' }),
  resolve: vi.fn().mockResolvedValue({ kind: 'clean' }),
  dismiss: vi.fn(),
  reloadReview: vi.fn(),
  ...overrides,
})

async function setup(
  options: {
    runner?: SyncRunner | null
    kind?: 'account' | 'guest'
    pending?: PendingChange[]
    cards?: Card[]
    state?: Partial<SyncState>
  } = {},
) {
  const { kind = 'account', pending = [], cards = [], state = {} } = options
  const value = 'runner' in options ? (options.runner ?? null) : runner()

  const sessionStore = createSessionStore(new InMemoryRepository<Session>())
  await sessionStore
    .getState()
    .set(
      kind === 'guest'
        ? makeGuestSession('g1', AT)
        : makeAccountSession('u1', { email: 'ada@b.co', name: 'Ada' }, AT),
    )
  const syncStateRepo = new InMemoryRepository<SyncState>()
  await syncStateRepo.save({ ...DEFAULT_SYNC_STATE, ...state })
  const syncStateStore = started(createSyncStateStore(syncStateRepo))
  const preferencesStore = preferencesStoreHolding(null)

  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={sessionStore}>
        <PendingChangeStoreContext
          value={started(createPendingChangeStore(new InMemoryRepository(pending)))}
        >
          <SyncStateStoreContext value={syncStateStore}>
            <PreferencesStoreContext value={preferencesStore}>
              <DeckStoreContext value={started(createDeckStore(new InMemoryRepository<Deck>()))}>
                <CardStoreContext value={started(createCardStore(new InMemoryRepository(cards)))}>
                  <FolderStoreContext
                    value={started(createFolderStore(new InMemoryRepository<Folder>()))}
                  >
                    <QuestionStoreContext
                      value={started(createQuestionStore(new InMemoryRepository<Question>()))}
                    >
                      <SyncRunnerContext value={value}>{children}</SyncRunnerContext>
                    </QuestionStoreContext>
                  </FolderStoreContext>
                </CardStoreContext>
              </DeckStoreContext>
            </PreferencesStoreContext>
          </SyncStateStoreContext>
        </PendingChangeStoreContext>
      </SessionStoreContext>
    </I18nextProvider>
  )
  render(wrap(<SettingsSyncPage />))
  return { runner: value, preferencesStore }
}

const change = (table: PendingChange['table'], entityId: string) =>
  makePendingChange({ table, entityId, op: 'save', at: AT })

describe('SettingsSyncPage', () => {
  it('tells a guest why there is nothing to synchronise', async () => {
    await setup({ runner: null, kind: 'guest' })
    expect(await screen.findByText(/guest sessions stay on this device/i)).toBeInTheDocument()
  })

  it('tells an unconfigured build there is no cloud at all', async () => {
    await setup({ runner: null })
    expect(await screen.findByText(/running without a cloud/i)).toBeInTheDocument()
  })

  it('says everything is synchronised, when it was, and as whom', async () => {
    await setup({ state: { lastSyncedAt: new Date().toISOString() } })
    expect(await screen.findByText('Your work is synchronised')).toBeInTheDocument()
    expect(screen.getByText(/last synchronised/i)).toBeInTheDocument()
    expect(screen.getByText('Synchronising as ada@b.co')).toBeInTheDocument()
    expect(screen.getByText(/nothing is waiting/i)).toBeInTheDocument()
  })

  it('counts what is waiting, and says the device has never synced', async () => {
    await setup({ pending: [change('decks', 'd1'), change('cards', 'c1'), change('cards', 'c2')] })
    expect(await screen.findByText('3 changes are waiting')).toBeInTheDocument()
    expect(screen.getByText(/never synchronised from this device/i)).toBeInTheDocument()
  })

  it('breaks the waiting changes down by table — progress and preferences included', async () => {
    await setup({
      pending: [
        change('decks', 'd1'),
        change('cards', 'c1'),
        change('cards', 'c2'),
        change('progress', 'progress'),
      ],
    })
    const decks = await screen.findByRole('button', { name: /Decks/ })
    expect(decks).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /Cards/ })).toHaveTextContent('2')
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('never calls a changed setting waiting, and says who looks after it', async () => {
    await setup({ pending: [change('preferences', 'preferences'), change('decks', 'd1')] })

    expect(await screen.findByText(/these look after themselves/i)).toBeInTheDocument()
    expect(screen.getByText(/go up on their own as soon as they change/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decks/ })).toHaveTextContent('1')
    expect(screen.queryByText('Preferences')).toBeNull()
  })

  it('says a stranded setting is waiting for a connection, not for the learner', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    await setup({ pending: [change('preferences', 'preferences')] })

    expect(await screen.findByText(/1 setting is waiting for a connection/i)).toBeInTheDocument()
    expect(screen.getByText(/your decks and cards are up to date/i)).toBeInTheDocument()
  })

  it('names a contributed table by the key its extension gave it', async () => {
    i18n.addResourceBundle('en', 'bible', { versesTable: 'Bible verses' }, true, false)
    await setup({
      pending: [change('bible_verses', 'v1')],
      runner: runner({
        tables: [...SYNCED_TABLES, 'bible_verses'],
        held: [...CORE_HELD_TABLES, 'bible_verses'],
        labelKeys: { bible_verses: 'bible:versesTable' },
      }),
    })
    expect(await screen.findByText('Bible verses')).toBeInTheDocument()
  })

  it('lists what a content table holds, by name, with a removal marked', async () => {
    await setup({
      pending: [
        change('cards', 'c1'),
        makePendingChange({ table: 'cards', entityId: 'c2', op: 'remove', at: AT }),
      ],
      cards: [makeCard({ id: 'c1', createdAt: AT, deckId: 'd', front: 'Ioan 3:16', back: 'x' })],
    })
    await userEvent.click(await screen.findByRole('button', { name: /Cards/ }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveTextContent('Cards waiting to synchronise')
    expect(sheet).toHaveTextContent('Ioan 3:16')
    expect(sheet).toHaveTextContent('c2')
  })

  it('shows the recent Syncs with how much moved, and why one failed', async () => {
    await setup({
      state: {
        log: [
          { at: AT, outcome: 'failed', pushed: 0, pulled: 0, reason: 'push refused' },
          { at: AT, outcome: 'merged', pushed: 3, pulled: 12 },
        ],
      },
    })
    expect(await screen.findByText('Did not finish')).toBeInTheDocument()
    expect(screen.getByText('push refused')).toBeInTheDocument()
    expect(screen.getByText('Merged')).toBeInTheDocument()
    expect(screen.getByText('↑ 3 · ↓ 12')).toBeInTheDocument()
  })

  it('shows the reason the last Sync failed', async () => {
    await setup({ runner: runner({ phase: 'failed', error: 'push refused' }) })
    expect(await screen.findByText('The last Sync did not finish')).toBeInTheDocument()
    expect(screen.getAllByText('push refused').length).toBeGreaterThan(0)
  })

  it('runs a Sync from Synchronise now', async () => {
    const { runner: value } = await setup()
    await userEvent.click(await screen.findByRole('button', { name: /synchronise now/i }))
    expect(value?.run).toHaveBeenCalled()
  })

  it('says so before the press when there is no network to synchronise over', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { runner: value } = await setup()
    const button = await screen.findByRole('button', { name: /synchronise now/i })
    expect(button).toBeDisabled()
    expect(screen.getByText("You're offline")).toBeInTheDocument()
    expect(screen.getByText(/reconnect to synchronise/i)).toBeInTheDocument()
    expect(value?.run).not.toHaveBeenCalled()
  })

  it('opens the review without syncing, and says so when nothing needs an answer', async () => {
    const { runner: value } = await setup()
    await userEvent.click(await screen.findByRole('button', { name: /review pending changes/i }))
    expect(value?.openReview).toHaveBeenCalled()
    expect(value?.run).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/nothing needs your answer/i))
  })

  it('checks everything against the cloud only after asking', async () => {
    const { runner: value } = await setup()
    await userEvent.click(await screen.findByRole('button', { name: /check everything/i }))
    expect(value?.repair).not.toHaveBeenCalled()
    await screen.findByRole('alertdialog')
    await userEvent.click(screen.getByRole('button', { name: 'Check everything' }))
    await waitFor(() => expect(value?.repair).toHaveBeenCalled())
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/matches the cloud/i)),
    )
  })

  it('turns Autosync off for the account — it is a preference, and follows it', async () => {
    const { preferencesStore } = await setup()
    expect(await screen.findByRole('switch', { name: /autosync/i })).toBeChecked()
    await userEvent.click(await screen.findByRole('switch', { name: /autosync/i }))
    await waitFor(() => expect(preferencesStore.getState().preferences?.autosync).toBe(false))
  })
})
