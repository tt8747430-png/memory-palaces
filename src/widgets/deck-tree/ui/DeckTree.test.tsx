import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeDeck } from '@/entities/deck'
import { makeCard } from '@/entities/card'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { DeckTree } from './DeckTree'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

function baseProps(
  overrides: Partial<Parameters<typeof DeckTree>[0]> = {},
): Parameters<typeof DeckTree>[0] {
  return {
    decks: [],
    cards: [],
    expanded: new Set<string>(),
    onToggle: vi.fn(),
    onOpen: vi.fn(),
    selectMode: false,
    selectedIds: new Set<string>(),
    onRequestSelect: vi.fn(),
    onToggleSelect: vi.fn(),
    ...overrides,
  }
}

describe('DeckTree', () => {
  it('renders top-level decks in order and opens one on tap', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const decks = [
      makeDeck({ id: 'b', createdAt: CREATED, name: 'Second', order: 1 }),
      makeDeck({ id: 'a', createdAt: CREATED, name: 'First', order: 0 }),
    ]
    renderWithProviders(<DeckTree {...baseProps({ decks, onOpen })} />)

    const openButtons = screen.getAllByRole('button', { name: /^Open / })
    expect(openButtons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Open First',
      'Open Second',
    ])

    await user.click(screen.getByRole('button', { name: 'Open First' }))
    expect(onOpen).toHaveBeenCalledWith('a')
  })

  it('toggles a parent deck from its expand control', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const decks = [
      makeDeck({ id: 'p', createdAt: CREATED, name: 'Parent', order: 0 }),
      makeDeck({ id: 'c', createdAt: CREATED, name: 'Child', order: 0, parentId: 'p' }),
    ]
    renderWithProviders(<DeckTree {...baseProps({ decks, onToggle })} />)

    await user.click(screen.getByRole('button', { name: 'Expand' }))
    expect(onToggle).toHaveBeenCalledWith('p')
  })

  it('shows the due count for a deck with due cards', () => {
    const decks = [makeDeck({ id: 'a', createdAt: CREATED, name: 'First', order: 0 })]
    const cards = [makeCard({ id: 'c1', createdAt: CREATED, deckId: 'a', front: 'Q', back: 'A' })]
    renderWithProviders(<DeckTree {...baseProps({ decks, cards })} />)
    expect(screen.getByText('Cards for today: 1')).toBeInTheDocument()
  })

  it('routes taps to selection and reflects the selected state in select mode', async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()
    const decks = [
      makeDeck({ id: 'a', createdAt: CREATED, name: 'First', order: 0 }),
      makeDeck({ id: 'b', createdAt: CREATED, name: 'Second', order: 1 }),
    ]
    renderWithProviders(
      <DeckTree
        {...baseProps({
          decks,
          selectMode: true,
          selectedIds: new Set(['a']),
          onToggleSelect,
        })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Select First' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Select Second' }))
    expect(onToggleSelect).toHaveBeenCalledWith('b')
  })
})
