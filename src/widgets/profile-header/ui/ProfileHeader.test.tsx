import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { ProfileHeader, type ProfileHeaderProps } from './ProfileHeader'

afterEach(cleanup)

function renderHeader(props: Partial<ProfileHeaderProps> = {}) {
  const merged: ProfileHeaderProps = {
    name: 'Ada Lovelace',
    xp: 600, // levelFromXp(600) → level 3
    palaceCount: 2,
    streakCount: 5,
    onOpenSettings: () => {},
    ...props,
  }
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileHeader {...merged} />
    </I18nextProvider>,
  )
}

describe('ProfileHeader', () => {
  it('renders the name as the page heading with a palaces · streak subtitle', () => {
    renderHeader()
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('2 palaces · 5-day streak')).toBeInTheDocument()
  })

  it('uses the singular subtitle for a single palace', () => {
    renderHeader({ palaceCount: 1, streakCount: 3 })
    expect(screen.getByText('1 palace · 3-day streak')).toBeInTheDocument()
  })

  it('shows the empty-state subtitle when there are no palaces', () => {
    renderHeader({ palaceCount: 0, streakCount: 0 })
    expect(screen.getByText('Build your first palace to begin')).toBeInTheDocument()
  })

  it('shows the level badge derived from xp', () => {
    renderHeader()
    expect(screen.getByText('Lv. 3')).toBeInTheDocument()
  })

  it('calls onOpenSettings when a settings button is tapped', () => {
    const onOpenSettings = vi.fn()
    renderHeader({ onOpenSettings })
    fireEvent.click(screen.getAllByRole('button', { name: 'Open settings' })[0]!)
    expect(onOpenSettings).toHaveBeenCalledOnce()
  })
})
