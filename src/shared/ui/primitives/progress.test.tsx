import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Progress } from './progress'

afterEach(cleanup)

describe('Progress', () => {
  it('exposes progressbar semantics with the current value when labelled', () => {
    renderWithProviders(<Progress value={40} label="40 XP to level 3" />)
    const bar = screen.getByRole('progressbar', { name: '40 XP to level 3' })
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps values above the max to 100', () => {
    renderWithProviders(<Progress value={150} label="Complete" />)
    expect(screen.getByRole('progressbar', { name: 'Complete' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('clamps negative values to 0', () => {
    renderWithProviders(<Progress value={-20} label="None" />)
    expect(screen.getByRole('progressbar', { name: 'None' })).toHaveAttribute('aria-valuenow', '0')
  })

  it('is decorative (hidden from the a11y tree) without a label', () => {
    const { container } = renderWithProviders(<Progress value={50} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(container.querySelector('[data-slot="progress"]')).toHaveAttribute('aria-hidden', 'true')
  })
})
