import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CollectionPreview } from './CollectionPreview'

afterEach(cleanup)

describe('CollectionPreview', () => {
  it('renders the title and children', () => {
    renderWithProviders(
      <CollectionPreview
        title="Recent decks"
        seeAllLabel="See all"
        ariaLabel="See all recent decks"
        onSeeAll={() => {}}
      >
        <span>Deck A</span>
      </CollectionPreview>,
    )
    expect(screen.getByRole('heading', { name: 'Recent decks' })).toBeInTheDocument()
    expect(screen.getByText('Deck A')).toBeInTheDocument()
  })

  it('fires onSeeAll from the see-all control', async () => {
    const user = userEvent.setup()
    const onSeeAll = vi.fn()
    renderWithProviders(
      <CollectionPreview
        title="Recent decks"
        seeAllLabel="See all"
        ariaLabel="See all recent decks"
        onSeeAll={onSeeAll}
      >
        <span>Deck A</span>
      </CollectionPreview>,
    )
    await user.click(screen.getByRole('button', { name: 'See all recent decks' }))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })
})
