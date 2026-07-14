import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createProgressStore, type Progress, ProgressStoreContext } from '@/entities/progress'
import { createDeckStore, type Deck, DeckStoreContext } from '@/entities/deck'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import {
  type AppNotification,
  createNotificationStore,
  NotificationStoreContext,
} from '@/entities/notification'
import {
  createProfileStore,
  makeProfile,
  type Profile,
  ProfileStoreContext,
} from '@/entities/profile'
import { ProfilePage, type ProfilePageProps } from './ProfilePage'

afterEach(cleanup)

function renderPage(props: ProfilePageProps = {}, profileSeed?: Profile) {
  const profileRepo = new InMemoryRepository<Profile>(profileSeed ? [profileSeed] : [])
  render(
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
        <NotificationStoreContext
          value={createNotificationStore(new InMemoryRepository<AppNotification>())}
        >
          <ProfileStoreContext value={createProfileStore(profileRepo)}>
            <ProgressStoreContext value={createProgressStore(new InMemoryRepository<Progress>())}>
              <DeckStoreContext value={createDeckStore(new InMemoryRepository<Deck>())}>
                <CardStoreContext value={createCardStore(new InMemoryRepository<Card>())}>
                  <FolderStoreContext value={createFolderStore(new InMemoryRepository<Folder>())}>
                    <ProfilePage {...props} />
                  </FolderStoreContext>
                </CardStoreContext>
              </DeckStoreContext>
            </ProgressStoreContext>
          </ProfileStoreContext>
        </NotificationStoreContext>
      </SessionStoreContext>
    </I18nextProvider>,
  )
}

describe('ProfilePage', () => {
  it('shows the headline stats in the hero', async () => {
    renderPage()
    expect(await screen.findByText('Day streak')).toBeInTheDocument()
    expect(screen.getByText('Total XP')).toBeInTheDocument()
  })

  it('opens the streak page from the streak headline stat', async () => {
    const onOpenStreak = vi.fn()
    renderPage({ onOpenStreak })
    fireEvent.click(await screen.findByRole('button', { name: /open streak/i }))
    expect(onOpenStreak).toHaveBeenCalledOnce()
  })

  it('opens the full badges and achievements pages from the see-all rows', async () => {
    const onOpenBadges = vi.fn()
    const onOpenAchievements = vi.fn()
    renderPage({ onOpenBadges, onOpenAchievements })
    fireEvent.click(await screen.findByRole('button', { name: 'See all badges' }))
    fireEvent.click(screen.getByRole('button', { name: 'See all achievements' }))
    expect(onOpenBadges).toHaveBeenCalledOnce()
    expect(onOpenAchievements).toHaveBeenCalledOnce()
  })

  it('shows the edited profile name in the hero', async () => {
    renderPage(
      {},
      makeProfile({ id: 'profile', createdAt: new Date(0).toISOString(), name: 'Grace Hopper' }),
    )
    expect(await screen.findByRole('heading', { name: 'Grace Hopper' })).toBeInTheDocument()
  })
})
