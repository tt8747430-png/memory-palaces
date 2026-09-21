import { CORE_HELD_TABLES, CORE_QUIET_TABLES, SYNCED_TABLES } from '@/shared/config/sync-tables'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { AccountDeletionPort, ScheduledDeletion } from '@/shared/api'
import { InMemoryRepository } from '@/shared/api'
import {
  AccountDeletionContext,
  AuthGatewayContext,
  type SyncOutcome,
  type SyncRunner,
  SyncRunnerContext,
} from '@/shared/lib'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { AuthProvider } from './AuthProvider'
import { ScheduledDeletionGate } from './ScheduledDeletionGate'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

const SCHEDULED: ScheduledDeletion = {
  requestedAt: '2026-09-15T00:00:00.000Z',
  purgeAfter: '2026-10-15T00:00:00.000Z',
}

function runner(restore: () => Promise<SyncOutcome>): SyncRunner {
  return {
    phase: 'idle',
    error: null,
    review: null,
    tables: SYNCED_TABLES,
    held: CORE_HELD_TABLES,
    quiet: CORE_QUIET_TABLES,
    labelKeys: {},
    run: vi.fn().mockResolvedValue({ kind: 'clean' }),
    restore: vi.fn(restore),
    repair: vi.fn().mockResolvedValue({ kind: 'clean' }),
    openReview: vi.fn().mockResolvedValue({ kind: 'clean' }),
    resolve: vi.fn().mockResolvedValue({ kind: 'clean' }),
    dismiss: vi.fn(),
    reloadReview: vi.fn(),
  }
}

async function setup(
  options: {
    scheduled?: () => Promise<ScheduledDeletion | null>
    kind?: 'account' | 'guest'
    port?: 'none'
    restore?: () => Promise<SyncOutcome>
    online?: boolean
  } = {},
) {
  const { kind = 'account', online = true } = options
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })

  const gateway = new LocalAuthGateway(() => 'u1')
  if (kind === 'account') await gateway.signUp({ name: 'Ada', email: 'ada@b.co', password: 'pw' })
  else await gateway.persistGuest()

  const deletion: AccountDeletionPort = {
    scheduled: vi.fn(options.scheduled ?? (() => Promise.resolve(null))),
    request: vi.fn(),
    cancel: vi.fn().mockResolvedValue(undefined),
  }
  const sync = runner(options.restore ?? (() => Promise.resolve({ kind: 'merged' })))

  render(
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>
        <AccountDeletionContext value={options.port === 'none' ? null : deletion}>
          <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
            <ProfileStoreContext value={createProfileStore(new InMemoryRepository<Profile>())}>
              <AuthProvider>
                <SyncRunnerContext value={sync}>
                  <ScheduledDeletionGate>
                    <div data-testid="app" />
                  </ScheduledDeletionGate>
                </SyncRunnerContext>
              </AuthProvider>
            </ProfileStoreContext>
          </SessionStoreContext>
        </AccountDeletionContext>
      </AuthGatewayContext>
    </I18nextProvider>,
  )
  return { deletion, sync }
}

describe('the scheduled-deletion check', () => {
  it('lets the app through once nothing is scheduled', async () => {
    const { deletion } = await setup()

    expect(await screen.findByTestId('app')).toBeInTheDocument()
    expect(deletion.scheduled).toHaveBeenCalled()
  })

  it('holds the app back while the check is out — it is never browsed into first', async () => {
    await setup({ scheduled: () => new Promise(() => {}) })

    expect(
      await screen.findByRole('status', { name: /checking your account/i }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('app')).not.toBeInTheDocument()
  })

  it('opens the app when the check outlasts its budget, and keeps checking', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let answer: (found: ScheduledDeletion | null) => void = () => {}
    await setup({ scheduled: () => new Promise((resolve) => (answer = resolve)) })
    await screen.findByRole('status', { name: /checking your account/i })

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByTestId('app')).toBeInTheDocument()

    await act(async () => answer(SCHEDULED))
    expect(await screen.findByRole('alert')).toHaveTextContent('Scheduled for deletion')
  })

  it('opens the app offline without asking — Mindscape studies offline', async () => {
    const { deletion } = await setup({ online: false })

    expect(await screen.findByTestId('app')).toBeInTheDocument()
    expect(deletion.scheduled).not.toHaveBeenCalled()
  })

  it('never asks for a guest — there is no account to schedule', async () => {
    const { deletion } = await setup({ kind: 'guest' })

    await screen.findByTestId('app')
    expect(deletion.scheduled).not.toHaveBeenCalled()
  })

  it('lets the app through when no Supabase project is configured', async () => {
    await setup({ port: 'none' })

    expect(await screen.findByTestId('app')).toBeInTheDocument()
  })

  it('offers only cancel or sign out once a deletion is scheduled, and states the date', async () => {
    await setup({ scheduled: () => Promise.resolve(SCHEDULED) })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Scheduled for deletion')
    expect(alert).toHaveTextContent(/October 15, 2026|15 October 2026/)
    expect(screen.queryByTestId('app')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel deletion' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('says so before the press when cancelling would need a network it does not have', async () => {
    const { deletion } = await setup({ scheduled: () => Promise.resolve(SCHEDULED) })
    await screen.findByRole('alert')

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByRole('button', { name: 'Cancel deletion' })).toBeDisabled()
    expect(screen.getByText(/cancelling needs a connection/i)).toBeInTheDocument()
    expect(deletion.cancel).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
  })

  it('opens the app as soon as the cancel lands, with the restore still running', async () => {
    let restored: (outcome: SyncOutcome) => void = () => {}
    const { deletion, sync } = await setup({
      scheduled: () => Promise.resolve(SCHEDULED),
      restore: () => new Promise((resolve) => (restored = resolve)),
    })
    await screen.findByRole('alert')

    await userEvent.click(screen.getByRole('button', { name: 'Cancel deletion' }))

    await waitFor(() => expect(screen.getByTestId('app')).toBeInTheDocument())
    expect(deletion.cancel).toHaveBeenCalled()
    expect(sync.restore).toHaveBeenCalled()
    restored({ kind: 'merged' })
  })
})
