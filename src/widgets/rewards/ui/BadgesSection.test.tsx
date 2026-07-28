import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Badge } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { BadgesSection } from './BadgesSection'

afterEach(cleanup)

const BADGES: Badge[] = [
  { id: 'xp', tiers: [100, 500, 2000], value: 0, tier: 0, current: null, next: 100 },
  { id: 'streak', tiers: [3, 7, 30], value: 10, tier: 2, current: 7, next: 30 },
]

function setup(overrides: Partial<Parameters<typeof BadgesSection>[0]> = {}) {
  const onSeeAll = vi.fn()
  const onOpenBadge = vi.fn()
  renderWithProviders(
    <BadgesSection badges={BADGES} onSeeAll={onSeeAll} onOpenBadge={onOpenBadge} {...overrides} />,
  )
  return { onSeeAll, onOpenBadge }
}

describe('BadgesSection', () => {
  it('renders the section heading and a preview tile per badge', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Badges' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'XP Collector' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Streak Keeper' })).toBeInTheDocument()
  })

  it('fires onSeeAll from the see-all control', async () => {
    const user = userEvent.setup()
    const { onSeeAll } = setup()
    await user.click(screen.getByRole('button', { name: 'See all badges' }))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })

  it('opens a badge from its preview tile', async () => {
    const user = userEvent.setup()
    const { onOpenBadge } = setup()
    await user.click(screen.getByRole('button', { name: 'XP Collector' }))
    expect(onOpenBadge).toHaveBeenCalledWith('xp')
  })
})
