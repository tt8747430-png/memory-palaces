import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SwipePreview } from './SwipePreview'

afterEach(cleanup)

describe('SwipePreview', () => {
  it('shows the row with both its swipes open, and offers no control of its own', () => {
    renderWithProviders(
      <SwipePreview type="deck" config={{ leading: ['favorite', 'move'], trailing: ['delete'] }} />,
    )

    expect(screen.getByText('Deck name')).toBeInTheDocument()
    // Arranging happens on the strips below. A picture that could also be edited would put two
    // ways of doing one thing on one screen.
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stands a dashed slot in for a side with nothing on it', () => {
    const { container } = renderWithProviders(
      <SwipePreview type="card" config={{ leading: [], trailing: ['flag'] }} />,
    )
    expect(container.querySelectorAll('.border-dashed')).toHaveLength(1)
  })
})
