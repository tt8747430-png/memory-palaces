import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Card } from './card'

afterEach(cleanup)

describe('Card', () => {
  it('renders children inside the card surface', () => {
    renderWithProviders(
      <Card>
        <span>Body</span>
      </Card>,
    )
    const card = screen.getByText('Body').parentElement
    expect(card).toHaveAttribute('data-slot', 'card')
    expect(card?.className).toContain('bg-card')
  })

  it('merges a custom className with the surface classes', () => {
    renderWithProviders(<Card className="custom-shell">Body</Card>)
    const card = screen.getByText('Body')
    expect(card.className).toContain('custom-shell')
    expect(card.className).toContain('bg-card')
  })

  it('forwards arbitrary div props', () => {
    renderWithProviders(<Card aria-label="summary">Body</Card>)
    expect(screen.getByLabelText('summary')).toBeInTheDocument()
  })
})
