import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { GlassCard } from './GlassCard'

afterEach(cleanup)

describe('GlassCard', () => {
  it('renders children with the default card tone', () => {
    renderWithProviders(<GlassCard>Content</GlassCard>)
    const card = screen.getByText('Content')
    expect(card.className).toContain('bg-card-glass')
  })

  it('applies the sky tone', () => {
    renderWithProviders(<GlassCard tone="sky">Content</GlassCard>)
    expect(screen.getByText('Content').className).toContain('bg-glass')
  })

  it('merges a custom className and forwards div props', () => {
    renderWithProviders(
      <GlassCard className="custom" aria-label="panel">
        Content
      </GlassCard>,
    )
    const card = screen.getByLabelText('panel')
    expect(card.className).toContain('custom')
    expect(card.className).toContain('shadow-featured')
  })
})
