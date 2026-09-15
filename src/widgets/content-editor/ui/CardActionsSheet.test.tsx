import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { type Card, makeCard } from '@/entities/card'
import { cardActionHandlers, type CardActionIntents } from '../model/card-actions'
import { CardActionsSheet } from './CardActionsSheet'

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

const intents = (over: Partial<CardActionIntents> = {}): CardActionIntents => ({
  onSelect: () => {},
  onEdit: () => {},
  onGrade: () => {},
  onStudyFrom: () => {},
  onToggleFlag: () => {},
  onMarkKnown: () => {},
  onResetSrs: () => {},
  onToggleFreeze: () => {},
  onToggleReverse: () => {},
  onMove: () => {},
  onDuplicate: () => {},
  onHistory: () => {},
  onDelete: () => {},
  ...over,
})

/** Builds the handler map the way a real screen does, with the real translator. */
function Harness({
  subject,
  actions,
  onOpenChange,
}: {
  subject: Card
  actions: CardActionIntents
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <CardActionsSheet
      open
      onOpenChange={onOpenChange}
      handlers={cardActionHandlers(subject, actions, t)}
    />
  )
}

function renderSheet(
  subject: Card = card(),
  over: Partial<CardActionIntents> = {},
  onOpenChange: (open: boolean) => void = () => {},
) {
  renderWithProviders(
    <Harness subject={subject} actions={intents(over)} onOpenChange={onOpenChange} />,
  )
}

describe('CardActionsSheet', () => {
  it('lists the whole card catalog in one order', async () => {
    renderSheet()
    await screen.findByRole('button', { name: 'Select' })
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Select',
      'Edit',
      'Set grade & schedule',
      'Study from this card',
      'Flag',
      'Mark as mastered',
      'Reset schedule',
      'Freeze',
      'Reverse',
      'Move',
      'Duplicate',
      'Learning history',
      'Delete',
    ])
  })

  it('flips the labels for a flagged, frozen, reversed card', async () => {
    renderSheet(card({ flagged: true, frozen: true, reversed: true }))
    expect(await screen.findByRole('button', { name: 'Unfreeze' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unreverse' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unflag' })).toBeInTheDocument()
  })

  it('leaves Study out when the surface cannot start a session', async () => {
    renderSheet(card(), { onStudyFrom: undefined })
    await screen.findByRole('button', { name: 'Select' })
    expect(screen.queryByRole('button', { name: 'Study from this card' })).toBeNull()
  })

  it('calls the handler and closes', async () => {
    const user = userEvent.setup()
    const onToggleFreeze = vi.fn()
    const onOpenChange = vi.fn()
    renderSheet(card(), { onToggleFreeze }, onOpenChange)
    await user.click(await screen.findByRole('button', { name: 'Freeze' }))
    expect(onToggleFreeze).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
