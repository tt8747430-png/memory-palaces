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

  it('renders an inline cover image straight away', () => {
    const inline = `data:image/png;base64,${btoa('cover')}`
    const { container } = renderWithProviders(<DeckCover icon="🗺️" color="" image={inline} />)
    const layer = container.querySelector('[style*="background-image"]')
    expect(layer?.getAttribute('style')).toContain('data:image/png')
  })

  it('shows the colour and icon, not a broken image, while a stored cover is not cached yet', () => {
    const { container } = renderWithProviders(
      <DeckCover icon="🗺️" color="from-rose-500 to-pink-600" image="u1/d1" />,
    )
    expect(container.querySelector('[style*="background-image: url"]')).toBeNull()
    expect(screen.getByText('🗺️')).toBeInTheDocument()
  })
})
