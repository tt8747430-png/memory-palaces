import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Chip } from './Chip'

afterEach(cleanup)

describe('Chip', () => {
  it('renders its label in the info badge', () => {
    renderWithProviders(<Chip>Due today</Chip>)
    const chip = screen.getByText('Due today')
    expect(chip.className).toContain('bg-info-surface')
  })

  it('renders an optional decorative leading icon', () => {
    const { container } = renderWithProviders(<Chip icon={<svg />}>Due</Chip>)
    expect(container.querySelector('span[aria-hidden] svg')).not.toBeNull()
  })
})
