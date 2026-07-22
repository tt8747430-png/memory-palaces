import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Badge } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { NextMilestoneCard } from './NextMilestoneCard'

afterEach(cleanup)

const BADGE: Badge = {
  id: 'xp',
  tiers: [100, 500, 2000],
  value: 50,
  tier: 0,
  current: null,
  next: 100,
}

describe('NextMilestoneCard', () => {
  it('renders the milestone heading, remaining detail and progress percentage', () => {
    renderWithProviders(<NextMilestoneCard badge={BADGE} />)
    expect(screen.getByText('Almost there')).toBeInTheDocument()
    // detail: '{{remaining}} more to your next {{label}} badge' → remaining 50, label 'XP Collector'
    expect(screen.getByText(/50 more to your next XP Collector badge/)).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('fires onOpen when tapped', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    renderWithProviders(<NextMilestoneCard badge={BADGE} onOpen={onOpen} />)
    await user.click(screen.getByRole('button', { name: /Almost there/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
