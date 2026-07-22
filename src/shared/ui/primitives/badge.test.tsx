import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Badge } from './badge'

afterEach(cleanup)

describe('Badge', () => {
  it('renders children with the default variant surface', () => {
    renderWithProviders(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge.className).toContain('bg-secondary')
  })

  it('applies the info variant', () => {
    renderWithProviders(<Badge variant="info">Due</Badge>)
    expect(screen.getByText('Due').className).toContain('bg-info-surface')
  })

  it('applies the outline variant', () => {
    renderWithProviders(<Badge variant="outline">Draft</Badge>)
    expect(screen.getByText('Draft').className).toContain('border')
  })

  it('forwards arbitrary span props', () => {
    renderWithProviders(<Badge aria-label="status">•</Badge>)
    expect(screen.getByLabelText('status')).toBeInTheDocument()
  })
})
