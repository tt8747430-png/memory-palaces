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
      </SessionStoreContext>
    </I18nextProvider>,
  )
}

describe('ProfilePage', () => {
  it('shows the statistics tab by default with the journey heading and stat tiles', async () => {
    renderPage()
    expect(await screen.findByText('Your Journey')).toBeInTheDocument()
    expect(screen.getByText('Total XP')).toBeInTheDocument()
    expect(screen.getByText('Best accuracy')).toBeInTheDocument()
  })

  it('switches to the achievements tab when its segment is tapped', async () => {
    renderPage()
    await screen.findByText('Your Journey')
    fireEvent.click(screen.getByRole('button', { name: 'Achievements' }))
    expect(await screen.findByText('Badges & Awards')).toBeInTheDocument()
    expect(screen.getByText('First Palace')).toBeInTheDocument()
    expect(screen.getByText('0/6')).toBeInTheDocument()
  })

  it('calls onOpenStats from the view-full-stats button', async () => {
    const onOpenStats = vi.fn()
    renderPage({ onOpenStats })
    fireEvent.click(await screen.findByRole('button', { name: /view full stats/i }))
    expect(onOpenStats).toHaveBeenCalledOnce()
  })

  it('shows the edited profile name in the hero', async () => {
    renderPage(
      {},
      makeProfile({ id: 'profile', createdAt: new Date(0).toISOString(), name: 'Grace Hopper' }),
    )
    expect(await screen.findByRole('heading', { name: 'Grace Hopper' })).toBeInTheDocument()
  })
})
