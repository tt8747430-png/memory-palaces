import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { DeckCover } from './DeckCover'

afterEach(cleanup)

describe('DeckCover', () => {
  it('renders the icon over a preset gradient', () => {
    renderWithProviders(<DeckCover icon="🗺️" color="from-rose-500 to-pink-600" />)
    expect(screen.getByText('🗺️')).toBeInTheDocument()
  })

  it('renders a cover image when provided', () => {
    const { container } = renderWithProviders(
      <DeckCover icon="🗺️" color="" image="https://example.com/cover.png" />,
    )
    const layer = container.querySelector('[style*="background-image"]')
    expect(layer).not.toBeNull()
    expect(layer?.getAttribute('style')).toContain('cover.png')
  })

  it('hides the icon when hideIcon is set', () => {
    renderWithProviders(<DeckCover icon="🗺️" color="from-rose-500 to-pink-600" hideIcon />)
    expect(screen.queryByText('🗺️')).toBeNull()
  })
})
