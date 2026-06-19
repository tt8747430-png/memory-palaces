import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { fakeStickyHeader } from '@/shared/test/sticky-header'
import { ProfileHeader, type ProfileHeaderProps } from './ProfileHeader'

afterEach(cleanup)

function renderHeader(props: Partial<ProfileHeaderProps> = {}) {
  const merged: ProfileHeaderProps = {
    header: fakeStickyHeader(),
    name: 'Ada Lovelace',
    username: 'ada',
    xp: 600,
    streakCount: 5,
    palaceCount: 3,
    joinedYear: 2026,
    unreadCount: 0,
    onOpenSettings: () => {},
    onOpenNotifications: () => {},
    onEditProfile: () => {},
    onOpenStreak: () => {},
    ...props,
  }
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileHeader {...merged} />
    </I18nextProvider>,
  )
}

describe('ProfileHeader', () => {
  it('renders the name as the page heading with a @handle · joined subtitle', () => {
    renderHeader()
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('@ada · Joined 2026')).toBeInTheDocument()
  })

  it('falls back to the handle-only subtitle when the joined year is unknown', () => {
    renderHeader({ joinedYear: null })
    expect(screen.getByText('@ada')).toBeInTheDocument()
  })

  it('shows the streak, XP and palaces headline stats', () => {
    renderHeader({ streakCount: 5, xp: 4600, palaceCount: 7 })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('4,600')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Day streak')).toBeInTheDocument()
    expect(screen.getByText('Total XP')).toBeInTheDocument()
    expect(screen.getByText('Palaces')).toBeInTheDocument()
  })

  it('opens the streak screen from the streak stat', () => {
    const onOpenStreak = vi.fn()
    renderHeader({ onOpenStreak })
    fireEvent.click(screen.getByRole('button', { name: /open streak/i }))
    expect(onOpenStreak).toHaveBeenCalledOnce()
  })

  it('calls onOpenSettings and onOpenNotifications from the header actions', () => {
    const onOpenSettings = vi.fn()
    const onOpenNotifications = vi.fn()
    renderHeader({ onOpenSettings, onOpenNotifications })
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(onOpenSettings).toHaveBeenCalledOnce()
    expect(onOpenNotifications).toHaveBeenCalledOnce()
  })

  it('edits the profile photo when the avatar is tapped', () => {
    const onEditProfile = vi.fn()
    renderHeader({ onEditProfile })
    fireEvent.click(screen.getByRole('button', { name: /edit profile photo/i }))
    expect(onEditProfile).toHaveBeenCalledOnce()
  })

  it('renders the photo when an avatar is provided', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ProfileHeader
          header={fakeStickyHeader()}
          name="Ada"
          username="ada"
          avatar="data:image/jpeg;base64,zzz"
          xp={0}
          streakCount={0}
          palaceCount={0}
          joinedYear={null}
          unreadCount={0}
          onOpenSettings={() => {}}
          onOpenNotifications={() => {}}
          onEditProfile={() => {}}
          onOpenStreak={() => {}}
        />
      </I18nextProvider>,
    )
    expect(container.querySelector('img[src="data:image/jpeg;base64,zzz"]')).toBeTruthy()
  })
})
