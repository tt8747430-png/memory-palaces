import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Badge } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { BadgeGrid } from './BadgeGrid'

afterEach(cleanup)

const BADGES: Badge[] = [
  { id: 'xp', tiers: [100, 500, 2000], value: 0, tier: 0, current: null, next: 100 },
  { id: 'streak', tiers: [3, 7, 30], value: 10, tier: 2, current: 7, next: 30 },
]

describe('BadgeGrid', () => {
  it('renders a tile per badge with its title and tier progress', () => {
    renderWithProviders(<BadgeGrid badges={BADGES} />)
    expect(screen.getByText('XP Collector')).toBeInTheDocument()
    expect(screen.getByText('Streak Keeper')).toBeInTheDocument()
    // tierProgress: '{{tier}} of {{total}}'
    expect(screen.getByText('0 of 3')).toBeInTheDocument()
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })

  it('opens a badge when its tile is tapped', async () => {
    const user = userEvent.setup()
    const onOpenBadge = vi.fn()
    renderWithProviders(<BadgeGrid badges={BADGES} onOpenBadge={onOpenBadge} />)
    await user.click(screen.getByRole('button', { name: /Streak Keeper/ }))
    expect(onOpenBadge).toHaveBeenCalledWith('streak')
  })
})
