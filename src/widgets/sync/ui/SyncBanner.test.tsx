import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
import { SyncBanner } from './SyncBanner'

afterEach(cleanup)

const AT = '2026-01-01T00:00:00.000Z'

const runner = (overrides: Partial<SyncRunner> = {}): SyncRunner => ({
  phase: 'idle',
  error: null,
  review: null,
  run: vi.fn().mockResolvedValue(undefined),
  restore: vi.fn().mockResolvedValue(undefined),
  openReview: vi.fn().mockResolvedValue({ kind: 'clean' }),
  resolve: vi.fn().mockResolvedValue(undefined),
  dismiss: vi.fn(),
  reloadReview: vi.fn(),
  ...overrides,
})

async function setup(
  options: {
    runner?: SyncRunner | null
    kind?: 'account' | 'guest'
    pending?: number
    cloudChanged?: boolean
    online?: boolean
  } = {},
) {
  const {
    runner: value = runner(),
    kind = 'account',
    pending = 0,
    cloudChanged = false,
    online = true,
  } = options

  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })

  // The session store owns its own writes and is never `start()`ed, so it is set the way
  // AuthProvider sets it.
  const sessionStore = createSessionStore(new InMemoryRepository<Session>())
  await sessionStore
    .getState()
    .set(
      kind === 'guest'
        ? makeGuestSession('s1', AT)
        : makeAccountSession('s1', { email: 'ada@b.co', name: 'Ada' }, AT),
    )
  const pendingRepo = new InMemoryRepository<PendingChange>()
  for (let i = 0; i < pending; i++) {
    await pendingRepo.save(
      makePendingChange({ contentCollection: 'decks', entityId: `d${i}`, op: 'save', at: AT }),
    )
  }
  const syncStateRepo = new InMemoryRepository<SyncState>()
  await syncStateRepo.save({ ...DEFAULT_SYNC_STATE, cloudChanged })

  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={sessionStore}>
        <PendingChangeStoreContext value={started(createPendingChangeStore(pendingRepo))}>
          <SyncStateStoreContext value={started(createSyncStateStore(syncStateRepo))}>
            <SyncRunnerContext value={value}>{children}</SyncRunnerContext>
          </SyncStateStoreContext>
        </PendingChangeStoreContext>
      </SessionStoreContext>
    </I18nextProvider>
  )

  render(wrap(<SyncBanner />))
  return { runner: value }
}

afterEach(() => Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }))

describe('SyncBanner', () => {
  it('is hidden for a guest — there is no cloud to be out of step with', async () => {
    await setup({ kind: 'guest', pending: 3 })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('is hidden when no Supabase project is configured', async () => {
    await setup({ runner: null, pending: 3 })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('is hidden when nothing is pending and the cloud has not moved', async () => {
    await setup()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('states the count and offers Synchronise', async () => {
    await setup({ pending: 2 })

    expect(await screen.findByRole('status')).toHaveTextContent('2 changes are waiting')
    expect(screen.getByRole('button', { name: 'Synchronise' })).toBeInTheDocument()
  })

  it('runs a Sync when Synchronise is pressed', async () => {
    const { runner: value } = await setup({ pending: 1 })

    await userEvent.click(await screen.findByRole('button', { name: 'Synchronise' }))

    expect(value?.run).toHaveBeenCalled()
  })

  it('says so and offers nothing offline', async () => {
    await setup({ pending: 1, online: false })

    expect(await screen.findByRole('status')).toHaveTextContent("you're offline")
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the reason and a Retry when a Sync failed', async () => {
    await setup({ runner: runner({ phase: 'failed', error: 'push refused' }) })

    const banner = await screen.findByRole('status')
    expect(banner).toHaveTextContent('Sync did not finish')
    expect(banner).toHaveTextContent('push refused')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('shows progress while restoring after a cancelled deletion', async () => {
    await setup({ runner: runner({ phase: 'restoring' }) })

    expect(await screen.findByRole('status')).toHaveTextContent('Restoring your data')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
