import { SYNCED_TABLES } from '@/shared/config/sync-tables'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { started } from '@/shared/test/started'
import { withoutFields } from '@/shared/test/legacy-document'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { AccountDeletionPort, ScheduledDeletion } from '@/shared/api'
import { InMemoryRepository, LocalObjectUrlStorage } from '@/shared/api'
import {
  AccountDeletionContext,
  AuthGatewayContext,
  ResetLocalDataContext,
  StoragePortContext,
  type SyncOutcome,
  type SyncRunner,
  SyncRunnerContext,
} from '@/shared/lib'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import {
  createProfileStore,
  makeProfile,
  type Profile,
  ProfileStoreContext,
} from '@/entities/profile'
import { createDeckStore, type Deck, DeckStoreContext } from '@/entities/deck'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { createProgressStore, type Progress, ProgressStoreContext } from '@/entities/progress'
import {
  type AppNotification,
  createNotificationStore,
  NotificationStoreContext,
} from '@/entities/notification'
import { SettingsProfilePage } from './SettingsProfilePage'

afterEach(cleanup)

const seeded = makeProfile({
  id: 'profile',
  createdAt: new Date(0).toISOString(),
  name: 'Ada',
  username: 'ada',
  email: 'ada@x.io',
})

const scheduled: ScheduledDeletion = {
  requestedAt: '2026-09-15T00:00:00.000Z',
  purgeAfter: '2026-10-15T00:00:00.000Z',
}

function renderPage(
  opts: {
    profile?: Profile
    decks?: Deck[]
    deletion?: Partial<AccountDeletionPort>
    runner?: Partial<SyncRunner>
  } = {},
) {
  const profileRepo = new InMemoryRepository<Profile>(opts.profile ? [opts.profile] : [])
  const deckRepo = new InMemoryRepository<Deck>(opts.decks ?? [])
  const handlers = {
    onBack: vi.fn(),
    onChangePassword: vi.fn(),
    onDeleteAccount: vi.fn(),
  }
  const deletion: AccountDeletionPort = {
    scheduled: vi.fn().mockResolvedValue(null),
    request: vi.fn().mockResolvedValue(scheduled),
    cancel: vi.fn().mockResolvedValue(undefined),
    ...opts.deletion,
  }
  const runner: SyncRunner = {
    phase: 'idle',
    error: null,
    review: null,
    tables: SYNCED_TABLES,
    labelKeys: {},
    run: vi.fn().mockResolvedValue({ kind: 'clean' }),
    restore: vi.fn().mockResolvedValue({ kind: 'clean' }),
    repair: vi.fn().mockResolvedValue({ kind: 'clean' }),
    openReview: vi.fn().mockResolvedValue({ kind: 'clean' }),
    resolve: vi.fn().mockResolvedValue({ kind: 'clean' }),
    dismiss: vi.fn(),
    reloadReview: vi.fn(),
    ...opts.runner,
  }
  const resetLocalData = vi.fn().mockResolvedValue(undefined)
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={new LocalAuthGateway()}>
        <StoragePortContext value={new LocalObjectUrlStorage()}>
          <AccountDeletionContext value={deletion}>
            <ResetLocalDataContext value={resetLocalData}>
              <SyncRunnerContext value={runner}>
                <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
                  <ProfileStoreContext value={started(createProfileStore(profileRepo))}>
                    <DeckStoreContext value={started(createDeckStore(deckRepo))}>
                      <CardStoreContext
                        value={started(createCardStore(new InMemoryRepository<Card>()))}
                      >
                        <FolderStoreContext
                          value={started(createFolderStore(new InMemoryRepository<Folder>()))}
                        >
                          <QuestionStoreContext
                            value={started(createQuestionStore(new InMemoryRepository<Question>()))}
                          >
                            <ProgressStoreContext
                              value={started(
                                createProgressStore(new InMemoryRepository<Progress>()),
                              )}
                            >
                              <NotificationStoreContext
                                value={started(
                                  createNotificationStore(
                                    new InMemoryRepository<AppNotification>(),
                                  ),
                                )}
                              >
                                {children}
                              </NotificationStoreContext>
                            </ProgressStoreContext>
                          </QuestionStoreContext>
                        </FolderStoreContext>
                      </CardStoreContext>
                    </DeckStoreContext>
                  </ProfileStoreContext>
                </SessionStoreContext>
              </SyncRunnerContext>
            </ResetLocalDataContext>
          </AccountDeletionContext>
        </StoragePortContext>
      </AuthGatewayContext>
    </I18nextProvider>
  )
  render(wrap(<SettingsProfilePage {...handlers} />))
  return { profileRepo, deckRepo, deletion, runner, resetLocalData, ...handlers }
}

describe('SettingsProfilePage', () => {
  it('hydrates name, username, and email from the stored profile', async () => {
    renderPage({ profile: seeded })
    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada@x.io')).toBeInTheDocument()
  })

  it('opens on a profile stored before the phone field existed', async () => {
    renderPage({ profile: withoutFields(seeded, 'phone') })
    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })

  it('disables save for an invalid email', async () => {
    const user = userEvent.setup()
    renderPage({ profile: seeded })
    const email = await screen.findByDisplayValue('ada@x.io')
    await user.clear(email)
    await user.type(email, 'not-an-email')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('saves edited name and username through the store and returns', async () => {
    const user = userEvent.setup()
    const { profileRepo, onBack } = renderPage({ profile: seeded })
    const username = await screen.findByDisplayValue('ada')
    await user.clear(username)
    await user.type(username, 'gracehopper')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(async () => {
      const [profile] = await profileRepo.getAll()
      expect(profile?.username).toBe('gracehopper')
    })
    expect(onBack).toHaveBeenCalled()
  })

  it('routes to the change-password screen from the masked password field', async () => {
    const user = userEvent.setup()
    const { onChangePassword } = renderPage({ profile: seeded })
    await user.click(await screen.findByRole('button', { name: /change password/i }))
    expect(onChangePassword).toHaveBeenCalled()
  })

  it('no longer offers log out here (moved to the Settings hub)', async () => {
    renderPage({ profile: seeded })
    await screen.findByDisplayValue('Ada')
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
  })

  const openDelete = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('button', { name: /delete account/i }))
    return screen.findByRole('dialog')
  }

  it('is gated offline before the press — deleting needs the server to answer now', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    try {
      const { runner, deletion } = renderPage({ profile: seeded })

      const row = await screen.findByRole('button', { name: /delete account/i })
      expect(row).toBeDisabled()
      expect(row).toHaveTextContent(/you're offline/i)
      expect(runner.run).not.toHaveBeenCalled()
      expect(deletion.request).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    }
  })

  it('synchronises first, and only then asks for the word', async () => {
    const user = userEvent.setup()
    let finish: (outcome: SyncOutcome) => void = () => {}
    const { runner, deletion } = renderPage({
      profile: seeded,
      runner: { run: vi.fn(() => new Promise<SyncOutcome>((resolve) => (finish = resolve))) },
    })

    const sheet = await openDelete(user)
    expect(within(sheet).getByRole('status')).toHaveTextContent(/synchronising your decks/i)
    expect(within(sheet).queryByPlaceholderText('DELETE')).not.toBeInTheDocument()
    expect(runner.run).toHaveBeenCalledTimes(1)

    finish({ kind: 'clean' })

    expect(await within(sheet).findByPlaceholderText('DELETE')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /schedule deletion/i })).toBeDisabled()
    expect(deletion.request).not.toHaveBeenCalled()
  })

  it('schedules the purge and wipes the device once the word matches', async () => {
    const user = userEvent.setup()
    const { deletion, runner, resetLocalData, onDeleteAccount } = renderPage({ profile: seeded })

    const sheet = await openDelete(user)
    await user.type(await within(sheet).findByPlaceholderText('DELETE'), 'DELETE')
    await user.click(within(sheet).getByRole('button', { name: /schedule deletion/i }))

    await waitFor(() => expect(deletion.request).toHaveBeenCalled())
    expect(runner.run).toHaveBeenCalledTimes(2)
    expect(resetLocalData).toHaveBeenCalled()
    expect(onDeleteAccount).toHaveBeenCalled()
  })

  it('stops and explains when the Sync could not finish — nothing is wiped, nothing scheduled', async () => {
    const user = userEvent.setup()
    const { deletion, resetLocalData, onDeleteAccount } = renderPage({
      profile: seeded,
      runner: { run: vi.fn().mockResolvedValue({ kind: 'failed', reason: 'push refused' }) },
    })

    const sheet = await openDelete(user)

    expect(await within(sheet).findByRole('alert')).toHaveTextContent(/nothing was deleted/i)
    expect(within(sheet).queryByPlaceholderText('DELETE')).not.toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /try again/i })).toBeEnabled()
    expect(deletion.request).not.toHaveBeenCalled()
    expect(resetLocalData).not.toHaveBeenCalled()
    expect(onDeleteAccount).not.toHaveBeenCalled()
  })

  it('gets out of the way when the Sync stops to ask about deletions', async () => {
    const user = userEvent.setup()
    const { deletion } = renderPage({
      profile: seeded,
      runner: {
        run: vi.fn().mockResolvedValue({ kind: 'needs-review', items: [] }),
      },
    })

    await user.click(await screen.findByRole('button', { name: /delete account/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deletion.request).not.toHaveBeenCalled()
  })
})
