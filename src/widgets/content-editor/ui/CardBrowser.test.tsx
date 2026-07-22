import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeCard } from '@/entities/card'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardBrowser } from './CardBrowser'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

const CARDS = [
  makeCard({
    id: 'c1',
    createdAt: CREATED,
    deckId: 'd1',
    front: 'First front',
    back: 'First back',
  }),
  makeCard({
    id: 'c2',
    createdAt: CREATED,
    deckId: 'd1',
    front: 'Second front',
    back: 'Second back',
  }),
]

function setup(overrides: Partial<Parameters<typeof CardBrowser>[0]> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onToggleFlag: vi.fn(),
    onDuplicate: vi.fn(),
    onMarkKnown: vi.fn(),
    onResetSrs: vi.fn(),
    onDelete: vi.fn(),
  }
  renderWithProviders(<CardBrowser open cards={CARDS} startId="c1" {...handlers} {...overrides} />)
  return handlers
}

describe('CardBrowser', () => {
  it('opens at the starting card and shows the position', async () => {
    setup()
    expect(await screen.findByText('First front')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 cards')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous card' })).toBeDisabled()
  })

  it('advances to the next card', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: 'Next card' }))
    expect(await screen.findByText('2 / 2 cards')).toBeInTheDocument()
    expect(await screen.findByText('Second front')).toBeInTheDocument()
  })

  it('edits the current card', async () => {
    const user = userEvent.setup()
    const handlers = setup()
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    expect(handlers.onEdit).toHaveBeenCalledWith('c1')
  })
})
