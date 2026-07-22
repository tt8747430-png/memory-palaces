import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { TierPips } from './TierPips'

afterEach(cleanup)

describe('TierPips', () => {
  it('renders one pip per total, filling the first N', () => {
    const { container } = renderWithProviders(<TierPips total={5} filled={2} />)
    const pips = container.querySelectorAll('span > span')
    expect(pips).toHaveLength(5)
    const filled = container.querySelectorAll('.bg-accent')
    expect(filled).toHaveLength(2)
  })

  it('renders no filled pips when filled is zero', () => {
    const { container } = renderWithProviders(<TierPips total={3} filled={0} />)
    expect(container.querySelectorAll('.bg-accent')).toHaveLength(0)
  })

  it('is hidden from the accessibility tree', () => {
    const { container } = renderWithProviders(<TierPips total={3} filled={1} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })
})
