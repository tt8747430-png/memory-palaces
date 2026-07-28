import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Achievement } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AchievementsSection } from './AchievementsSection'

afterEach(cleanup)

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-deck', earned: true },
  { id: 'week-warrior', earned: false },
]

function setup(overrides: Partial<Parameters<typeof AchievementsSection>[0]> = {}) {
  const onSeeAll = vi.fn()
  const onOpenAchievement = vi.fn()
  renderWithProviders(
    <AchievementsSection
      achievements={ACHIEVEMENTS}
      onSeeAll={onSeeAll}
      onOpenAchievement={onOpenAchievement}
      {...overrides}
    />,
  )
  return { onSeeAll, onOpenAchievement }
}

describe('AchievementsSection', () => {
  it('renders the section heading and a preview tile per achievement', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'First Deck' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Week Warrior' })).toBeInTheDocument()
  })

  it('fires onSeeAll from the see-all control', async () => {
    const user = userEvent.setup()
    const { onSeeAll } = setup()
    await user.click(screen.getByRole('button', { name: 'See all achievements' }))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })

  it('opens an achievement from its preview tile', async () => {
    const user = userEvent.setup()
    const { onOpenAchievement } = setup()
    await user.click(screen.getByRole('button', { name: 'Week Warrior' }))
    expect(onOpenAchievement).toHaveBeenCalledWith('week-warrior')
  })
})
