import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createProfileStore,
  makeProfile,
  ProfileStoreContext,
  type Profile,
} from '@/entities/profile'
import { createPalaceStore, makePalace, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import { createQuestionStore, QuestionStoreContext, type Question } from '@/entities/question'
import { createProgressStore, ProgressStoreContext, type Progress } from '@/entities/progress'
import {
  createNotificationStore,
  NotificationStoreContext,
  type AppNotification,
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

function renderPage(opts: { profile?: Profile; palaces?: Palace[] } = {}) {
  const profileRepo = new InMemoryRepository<Profile>(opts.profile ? [opts.profile] : [])
  const palaceRepo = new InMemoryRepository<Palace>(opts.palaces ?? [])
  const handlers = {
    onBack: vi.fn(),
    onChangePassword: vi.fn(),
    onDeleteAccount: vi.fn(),
  }
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <ProfileStoreContext value={createProfileStore(profileRepo)}>
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(new InMemoryRepository<Room>())}>
            <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>())}>
              <QuestionStoreContext value={createQuestionStore(new InMemoryRepository<Question>())}>
                <ProgressStoreContext
                  value={createProgressStore(new InMemoryRepository<Progress>())}
                >
                  <NotificationStoreContext
                    value={createNotificationStore(new InMemoryRepository<AppNotification>())}
                  >
                    {children}
                  </NotificationStoreContext>
                </ProgressStoreContext>
              </QuestionStoreContext>
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </ProfileStoreContext>
    </I18nextProvider>
  )
  render(wrap(<SettingsProfilePage {...handlers} />))
  return { profileRepo, palaceRepo, ...handlers }
}

describe('SettingsProfilePage', () => {
  it('hydrates name, username, and email from the stored profile', async () => {
    renderPage({ profile: seeded })
    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada@x.io')).toBeInTheDocument()
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

  it('deletes the account only after confirming — wiping palaces and signing out', async () => {
    const user = userEvent.setup()
    const palace = makePalace({ id: 'p1', createdAt: new Date(0).toISOString(), name: 'Home' })
    const { palaceRepo, onDeleteAccount } = renderPage({ profile: seeded, palaces: [palace] })

    await user.click(await screen.findByRole('button', { name: /delete account/i }))
    expect(onDeleteAccount).not.toHaveBeenCalled()
    expect(await palaceRepo.getAll()).toHaveLength(1)

    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: /delete account/i }))

    await waitFor(async () => expect(await palaceRepo.getAll()).toEqual([]))
    expect(onDeleteAccount).toHaveBeenCalled()
  })
})
