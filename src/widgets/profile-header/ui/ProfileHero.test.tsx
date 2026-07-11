import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { ProfileHero, type ProfileHeroProps } from './ProfileHero'

afterEach(cleanup)

function renderHero(props: Partial<ProfileHeroProps> = {}) {
  const merged: ProfileHeroProps = {
    name: 'Ada Lovelace',
    username: 'ada',
    xp: 600,
    streakCount: 5,
    palaceCount: 3,
    joinedYear: 2026,
    onEditProfile: () => {},
    onOpenStreak: () => {},
    ...props,
  }
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileHero {...merged} />
    </I18nextProvider>,
  )
}

describe('ProfileHero', () => {
  it('shows the @handle · joined subtitle', () => {
    renderHero()
    expect(screen.getByText('@ada · Joined 2026')).toBeInTheDocument()
  })

  it('falls back to the handle-only subtitle when the joined year is unknown', () => {
    renderHero({ joinedYear: null })
    expect(screen.getByText('@ada')).toBeInTheDocument()
  })

  it('shows the streak, XP and decks headline stats', () => {
    renderHero({ streakCount: 5, xp: 4600, palaceCount: 7 })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('4,600')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Day streak')).toBeInTheDocument()
    expect(screen.getByText('Total XP')).toBeInTheDocument()
    expect(screen.getByText('Decks')).toBeInTheDocument()
  })

  it('shows the level and the XP-to-next meter', () => {
    renderHero({ xp: 600 }) // level 3, 100 into the level → 150 remaining
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.getByText('150 XP to level 4')).toBeInTheDocument()
  })

  it('opens the streak screen from the streak stat', () => {
    const onOpenStreak = vi.fn()
    renderHero({ onOpenStreak })
    fireEvent.click(screen.getByRole('button', { name: /open streak/i }))
    expect(onOpenStreak).toHaveBeenCalledOnce()
  })

  it('edits the profile photo when the avatar is tapped', () => {
    const onEditProfile = vi.fn()
    renderHero({ onEditProfile })
    fireEvent.click(screen.getByRole('button', { name: /edit profile photo/i }))
    expect(onEditProfile).toHaveBeenCalledOnce()
  })

  it('renders the photo when an avatar is provided', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ProfileHero
          name="Ada"
          username="ada"
          avatar="data:image/jpeg;base64,zzz"
          xp={0}
          streakCount={0}
          palaceCount={0}
          joinedYear={null}
          onEditProfile={() => {}}
          onOpenStreak={() => {}}
        />
      </I18nextProvider>,
    )
    expect(container.querySelector('img[src="data:image/jpeg;base64,zzz"]')).toBeTruthy()
  })
})
