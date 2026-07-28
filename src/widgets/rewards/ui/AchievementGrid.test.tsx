import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Achievement } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AchievementGrid } from './AchievementGrid'

afterEach(cleanup)

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-deck', earned: true },
  { id: 'week-warrior', earned: false },
]

describe('AchievementGrid', () => {
  it('renders a tile per achievement with its earned/locked status', () => {
    renderWithProviders(<AchievementGrid achievements={ACHIEVEMENTS} />)
    expect(screen.getByText('First Deck')).toBeInTheDocument()
    expect(screen.getByText('Week Warrior')).toBeInTheDocument()
    expect(screen.getByText('Earned')).toBeInTheDocument()
    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('opens an achievement when its tile is tapped', async () => {
    const user = userEvent.setup()
    const onOpenAchievement = vi.fn()
    renderWithProviders(
      <AchievementGrid achievements={ACHIEVEMENTS} onOpenAchievement={onOpenAchievement} />,
    )
    await user.click(screen.getByRole('button', { name: /First Deck/ }))
    expect(onOpenAchievement).toHaveBeenCalledWith('first-deck')
  })

  it('renders static tiles (no buttons) without an open handler', () => {
    renderWithProviders(<AchievementGrid achievements={ACHIEVEMENTS} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
