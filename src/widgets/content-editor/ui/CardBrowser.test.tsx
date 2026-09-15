import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Card, makeCard } from '@/entities/card'
import type { ActionHandlers } from '@/shared/ui'
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
  makeCard({
    id: 'c3',
    createdAt: CREATED,
    deckId: 'd1',
    front: 'Third front',
    back: 'Third back',
  }),
]

/** The filmstrip repeats every front, so face queries must skip it. */
const face = (text: string) => screen.findByText(text, { ignore: '[role="tablist"] *' })

function setup(overrides: Partial<Parameters<typeof CardBrowser>[0]> = {}) {
  const onDelete = vi.fn()
  const handlers = {
    onClose: vi.fn(),
    onEdit: vi.fn(),
    actionsFor: (card: Card): ActionHandlers => ({
      delete: { onAction: () => onDelete(card.id) },
      flag: { onAction: () => {} },
    }),
  }
  renderWithProviders(<CardBrowser open cards={CARDS} startId="c1" {...handlers} {...overrides} />)
  return { ...handlers, onDelete }
}

describe('CardBrowser', () => {
  it('opens at the starting card and shows the position', async () => {
    setup()
    expect(await face('First front')).toBeInTheDocument()
    expect(screen.getByText('1 / 3 cards')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous card' })).toBeDisabled()
  })

  it('advances to the next card', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: 'Next card' }))
    expect(await screen.findByText('2 / 3 cards')).toBeInTheDocument()
    expect(await face('Second front')).toBeInTheDocument()
  })

  it('peeks at the card the next swipe will actually promote', async () => {
    setup()
    await face('First front')

    const queued = [...document.querySelectorAll<HTMLElement>('[aria-hidden][inert]')].filter(
      (node) => node.style.zIndex !== '',
    )
    const nearest = queued.reduce((a, b) =>
      Number(a.style.zIndex) > Number(b.style.zIndex) ? a : b,
    )

    expect(nearest).toHaveTextContent('Second front')
    expect(nearest).not.toHaveTextContent('Third front')
  })

  it('edits the current card from the header', async () => {
    const user = userEvent.setup()
    const handlers = setup()
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    expect(handlers.onEdit).toHaveBeenCalledWith('c1')
  })

  it('jumps straight to a card from the filmstrip', async () => {
    const user = userEvent.setup()
    setup()
    const strip = await screen.findByRole('tablist', { name: 'Jump to a card' })
    await user.click(within(strip).getByRole('tab', { name: 'Card 3 of 3' }))
    expect(await screen.findByText('3 / 3 cards')).toBeInTheDocument()
    expect(await face('Third front')).toBeInTheDocument()
  })

  it('marks the card on screen as the selected thumbnail', async () => {
    setup()
    const strip = await screen.findByRole('tablist', { name: 'Jump to a card' })
    expect(within(strip).getByRole('tab', { name: 'Card 1 of 3' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('runs the card catalog from its menu', async () => {
    const user = userEvent.setup()
    const handlers = setup()
    await user.click(await screen.findByRole('button', { name: 'Card actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(handlers.onDelete).toHaveBeenCalledWith('c1')
  })

  it('leaves Edit to the header rather than repeating it in the menu', async () => {
    const user = userEvent.setup()
    setup({
      actionsFor: () => ({ edit: { onAction: () => {} }, delete: { onAction: () => {} } }),
    })
    await user.click(await screen.findByRole('button', { name: 'Card actions' }))
    await screen.findByRole('menuitem', { name: 'Delete' })
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
  })
})
