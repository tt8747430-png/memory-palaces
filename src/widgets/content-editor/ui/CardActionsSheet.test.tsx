import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { type Card, makeCard } from '@/entities/card'
import { CardActionsSheet, type CardActionHandlers } from './CardActionsSheet'

afterEach(cleanup)

const card = (over: Partial<Card> = {}): Card => ({
  ...makeCard({
    id: 'c1',
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: 'f',
    back: 'b',
  }),
  ...over,
})

const noHandlers: CardActionHandlers = {
  onSelect: () => {},
  onEdit: () => {},
  onFreeze: () => {},
  onMove: () => {},
  onReverse: () => {},
  onDuplicate: () => {},
  onHistory: () => {},
  onDelete: () => {},
}

function renderSheet(
  subject: Card,
  overrides: Partial<CardActionHandlers> & { onOpenChange?: (open: boolean) => void } = {},
) {
  const { onOpenChange = () => {}, ...handlers } = overrides
  renderWithProviders(
    <CardActionsSheet
      card={subject}
      open
      onOpenChange={onOpenChange}
      handlers={{ ...noHandlers, ...handlers }}
    />,
  )
}

describe('CardActionsSheet', () => {
  it('lists the eight actions in order', async () => {
    renderSheet(card({ frozen: false, reversed: false }))
    await screen.findByRole('button', { name: 'Select' })
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Select',
      'Edit',
      'Freeze',
      'Move',
      'Reverse',
      'Duplicate',
      'Learning history',
      'Delete',
    ])
  })

  it('flips the labels for a frozen, reversed card', async () => {
    renderSheet(card({ frozen: true, reversed: true }))
    expect(await screen.findByRole('button', { name: 'Unfreeze' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unreverse' })).toBeInTheDocument()
  })

  it('calls the handler and closes', async () => {
    const user = userEvent.setup()
    const onFreeze = vi.fn()
    const onOpenChange = vi.fn()
    renderSheet(card(), { onFreeze, onOpenChange })
    await user.click(await screen.findByRole('button', { name: 'Freeze' }))
    expect(onFreeze).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
