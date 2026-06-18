import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { fakeCollapsibleHeader } from '@/shared/test/collapsible-header'
import { ProfileHeader, type ProfileHeaderProps } from './ProfileHeader'

afterEach(cleanup)

function renderHeader(props: Partial<ProfileHeaderProps> = {}) {
  const merged: ProfileHeaderProps = {
    header: fakeCollapsibleHeader(),
    name: 'Ada Lovelace',
    username: 'ada',
    xp: 600, // levelFromXp(600) → level 3
    joinedYear: 2026,
    unreadCount: 0,
    onOpenSettings: () => {},
    onOpenNotifications: () => {},
    onEditProfile: () => {},
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

  it('shows the level badge derived from xp', () => {
    renderHeader()
    expect(screen.getAllByText('Level 3').length).toBeGreaterThan(0)
  })

  it('calls onOpenSettings and onOpenNotifications from the header actions', () => {
    const onOpenSettings = vi.fn()
    const onOpenNotifications = vi.fn()
    renderHeader({ onOpenSettings, onOpenNotifications })
    fireEvent.click(screen.getAllByRole('button', { name: 'Open settings' })[0]!)
    fireEvent.click(screen.getAllByRole('button', { name: /notifications/i })[0]!)
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
          header={fakeCollapsibleHeader()}
          name="Ada"
          username="ada"
          avatar="data:image/jpeg;base64,zzz"
          xp={0}
          joinedYear={null}
          unreadCount={0}
          onOpenSettings={() => {}}
          onOpenNotifications={() => {}}
          onEditProfile={() => {}}
        />
      </I18nextProvider>,
    )
    expect(container.querySelector('img[src="data:image/jpeg;base64,zzz"]')).toBeTruthy()
  })
})
