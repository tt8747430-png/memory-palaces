import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { fakeStickyHeader } from '@/shared/test/sticky-header'
import { ProfileBar, type ProfileBarProps } from './ProfileBar'

afterEach(cleanup)

function renderBar(props: Partial<ProfileBarProps> = {}) {
  const merged: ProfileBarProps = {
    header: fakeStickyHeader(),
    name: 'Ada Lovelace',
    unreadCount: 0,
    onOpenNotifications: () => {},
    onOpenSettings: () => {},
    ...props,
  }
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileBar {...merged} />
    </I18nextProvider>,
  )
}

describe('ProfileBar', () => {
  it('renders the name as the page heading', () => {
    renderBar()
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
  })

  it('calls onOpenSettings and onOpenNotifications from the actions', () => {
    const onOpenSettings = vi.fn()
    const onOpenNotifications = vi.fn()
    renderBar({ onOpenSettings, onOpenNotifications })
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(onOpenSettings).toHaveBeenCalledOnce()
    expect(onOpenNotifications).toHaveBeenCalledOnce()
  })

  it('caps the unread badge at 9+', () => {
    renderBar({ unreadCount: 12 })
    expect(screen.getByText('9+')).toBeInTheDocument()
  })
})
