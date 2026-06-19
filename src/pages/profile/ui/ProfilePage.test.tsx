import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createProgressStore, ProgressStoreContext, type Progress } from '@/entities/progress'
import { createPalaceStore, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import { createSessionStore, SessionStoreContext, type Session } from '@/entities/session'
import {
  createNotificationStore,
  NotificationStoreContext,
  type AppNotification,
} from '@/entities/notification'
import {
  createProfileStore,
  makeProfile,
  ProfileStoreContext,
  type Profile,
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
              <PalaceStoreContext value={createPalaceStore(new InMemoryRepository<Palace>())}>
                <RoomStoreContext value={createRoomStore(new InMemoryRepository<Room>())}>
                  <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>())}>
                    <ProfilePage {...props} />
                  </LocusStoreContext>
                </RoomStoreContext>
              </PalaceStoreContext>
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
