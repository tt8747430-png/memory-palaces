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
  selectSyncState,
  type SyncState,
  SyncStateStoreContext,
} from '@/entities/sync-state'
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
  run: vi.fn().mockResolvedValue({ kind: 'clean' }),
  restore: vi.fn().mockResolvedValue({ kind: 'clean' }),
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
  } = {},
) {
  const { kind = 'account', pending = [] } = options
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
  await syncStateRepo.save(DEFAULT_SYNC_STATE)
  const syncStateStore = started(createSyncStateStore(syncStateRepo))

  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={sessionStore}>
        <PendingChangeStoreContext
          value={started(createPendingChangeStore(new InMemoryRepository(pending)))}
        >
          <SyncStateStoreContext value={syncStateStore}>
            <SyncRunnerContext value={value}>{children}</SyncRunnerContext>
          </SyncStateStoreContext>
        </PendingChangeStoreContext>
      </SessionStoreContext>
    </I18nextProvider>
  )
  render(wrap(<SettingsSyncPage />))
  return { runner: value, syncStateStore }
}

const change = (contentCollection: PendingChange['contentCollection'], entityId: string) =>
  makePendingChange({ contentCollection, entityId, op: 'save', at: AT })

describe('SettingsSyncPage', () => {
  it('tells a guest why there is nothing to synchronise', async () => {
    await setup({ runner: null, kind: 'guest' })
    expect(await screen.findByText(/guest sessions stay on this device/i)).toBeInTheDocument()
  })

  it('tells an unconfigured build there is no cloud at all', async () => {
    await setup({ runner: null })
    expect(await screen.findByText(/running without a cloud/i)).toBeInTheDocument()
  })

  it('breaks the waiting changes down by kind', async () => {
    await setup({ pending: [change('decks', 'd1'), change('cards', 'c1'), change('cards', 'c2')] })

    expect(await screen.findByText('1 deck')).toBeInTheDocument()
    expect(screen.getByText('2 cards')).toBeInTheDocument()
  })

  it('says so when nothing is waiting and the device has never synced', async () => {
    await setup()

    expect(await screen.findByText(/nothing is waiting/i)).toBeInTheDocument()
    expect(screen.getByText(/never synchronised from this device/i)).toBeInTheDocument()
  })

  it('runs a Sync from Synchronise now', async () => {
    const { runner: value } = await setup()

    await userEvent.click(await screen.findByRole('button', { name: /synchronise now/i }))

    expect(value?.run).toHaveBeenCalled()
  })

  it('says so before the press when there is no network to synchronise over', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { runner: value } = await setup()

    const row = await screen.findByRole('button', { name: /synchronise now/i })

    expect(row).toBeDisabled()
    expect(row).toHaveTextContent(/reconnect to synchronise/i)
    expect(value?.run).not.toHaveBeenCalled()
  })

  it('opens the review without syncing, and says so when nothing needs an answer', async () => {
    const { runner: value } = await setup()

    await userEvent.click(await screen.findByRole('button', { name: /review pending changes/i }))

    expect(value?.openReview).toHaveBeenCalled()
    expect(value?.run).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/nothing needs your answer/i))
  })

  // On by default now, so the switch's job on a new device is to turn it *off* — the setting is
  // device-local either way, and nothing about it reaches the account.
  it('turns Autosync off for this device', async () => {
    const { syncStateStore } = await setup()

    expect(await screen.findByRole('switch', { name: /autosync/i })).toBeChecked()
    await userEvent.click(await screen.findByRole('switch', { name: /autosync/i }))

    await waitFor(() => expect(selectSyncState(syncStateStore.getState()).autosync).toBe(false))
  })
})
