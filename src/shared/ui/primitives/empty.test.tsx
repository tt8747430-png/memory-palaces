import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Empty } from './empty'

afterEach(cleanup)

describe('Empty', () => {
  it('renders the title and description', () => {
    renderWithProviders(<Empty title="No decks yet" description="Create your first deck." />)
    expect(screen.getByRole('heading', { name: 'No decks yet' })).toBeInTheDocument()
    expect(screen.getByText('Create your first deck.')).toBeInTheDocument()
  })

  it('renders an emoji medallion when no icon is provided', () => {
    renderWithProviders(<Empty emoji="📚" title="Empty" description="Nothing here." />)
    expect(screen.getByText('📚')).toBeInTheDocument()
  })

  it('renders the optional action slot', () => {
    renderWithProviders(
      <Empty
        title="Empty"
        description="Nothing here."
        action={<button type="button">Add deck</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Add deck' })).toBeInTheDocument()
  })

  it('prefers a provided icon over an emoji', () => {
    renderWithProviders(
      <Empty
        icon={<svg aria-hidden="true" />}
        emoji="📚"
        title="Empty"
        description="Nothing here."
      />,
    )
    expect(screen.queryByText('📚')).toBeNull()
  })
})
