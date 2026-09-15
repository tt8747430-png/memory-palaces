import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Card, makeCard } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import { markKnown, schedule, srsStatus } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import type { CardProgressChange } from '../model/card-progress-change'
import { CardProgressSheet } from './CardProgressSheet'

afterEach(cleanup)

const card = (over: Partial<Card> = {}): Card => ({
  ...makeCard({
    id: 'c1',
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: 'Ich bin',
    back: 'I am',
  }),
  ...over,
})

function renderSheet(subject: Card = card(), algorithm: LearningAlgorithm = 'spaced') {
  const onApply = vi.fn<(change: CardProgressChange) => void>()
  const onOpenChange = vi.fn()
  renderWithProviders(
    <CardProgressSheet
      card={subject}
      algorithm={algorithm}
      onOpenChange={onOpenChange}
      onApply={onApply}
    />,
  )
  return { onApply, onOpenChange }
}

const applied = (onApply: { mock: { calls: [CardProgressChange][] } }) => onApply.mock.calls[0]?.[0]

const apply = () => screen.getByRole('button', { name: 'Apply' })

describe('CardProgressSheet', () => {
  it('has nothing to apply until the card would actually move', async () => {
    renderSheet()
    expect(await screen.findByText('Card progress')).toBeInTheDocument()
    expect(apply()).toBeDisabled()
  })

  it('applies a grade through the real scheduler and records it as an answer', async () => {
    const user = userEvent.setup()
    const { onApply, onOpenChange } = renderSheet()

    await user.click(await screen.findByRole('button', { name: /good/i }))
    await user.click(apply())

    const change = applied(onApply)
    expect(change).toMatchObject({
      kind: 'schedule',
      grade: 'good',
      srs: { interval: schedule(undefined, 'good', Date.now()).interval },
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('sets a status the learner picked, without claiming it was answered', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet()

    await user.click(await screen.findByRole('button', { name: 'Mastered' }))
    await user.click(apply())

    const change = applied(onApply)
    expect(change?.kind === 'schedule' && change.grade).toBeUndefined()
    expect(srsStatus(change?.kind === 'schedule' ? change.srs : undefined)).toBe('known')
  })

  it('puts a studied card back to new', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet(card({ srs: markKnown(undefined, Date.now()) }))

    await user.click(await screen.findByRole('button', { name: 'New' }))
    await user.click(apply())

    expect(onApply).toHaveBeenCalledWith({ kind: 'schedule', srs: undefined, grade: undefined })
  })

  it('moves the next review to a picked day', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet()

    fireEvent.change(await screen.findByLabelText('Next review'), {
      target: { value: '2030-01-01' },
    })
    await user.click(apply())

    const change = applied(onApply)
    expect(change).toMatchObject({ kind: 'schedule', grade: undefined })
    expect(change?.kind === 'schedule' ? change.srs?.due.slice(0, 10) : '').toBe('2030-01-01')
  })

  it('grades on top of a status set in the same visit', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet()

    await user.click(await screen.findByRole('button', { name: 'Mastered' }))
    await user.click(screen.getByRole('button', { name: /good/i }))
    await user.click(apply())

    const change = applied(onApply)
    expect(change).toMatchObject({ kind: 'schedule', grade: 'good' })
    // A graded mastered card keeps its long interval; it did not fall back to a new card's 1d.
    expect(change?.kind === 'schedule' ? (change.srs?.interval ?? 0) : 0).toBeGreaterThan(30)
  })

  it('keeps a grade folded in when the day is moved afterwards', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet()

    await user.click(await screen.findByRole('button', { name: /easy/i }))
    fireEvent.change(screen.getByLabelText('Next review'), { target: { value: '2030-01-01' } })
    await user.click(apply())

    const change = applied(onApply)
    expect(change).toMatchObject({ kind: 'schedule', grade: undefined })
    expect(change?.kind === 'schedule' ? change.srs?.reps : 0).toBe(1)
    expect(change?.kind === 'schedule' ? change.srs?.due.slice(0, 10) : '').toBe('2030-01-01')
  })

  it('sets the last outcome on a fast deck, which keeps no schedule', async () => {
    const user = userEvent.setup()
    const { onApply } = renderSheet(card(), 'fast')

    expect(await screen.findByText('Card progress')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()
    expect(screen.queryByLabelText('Next review')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(apply())

    expect(onApply).toHaveBeenCalledWith({ kind: 'fastReview', outcome: 'gotIt' })
  })

  it('has nothing to apply on a fast deck until the outcome changes', async () => {
    const user = userEvent.setup()
    renderSheet(card({ fastReview: 'gotIt' }), 'fast')

    await screen.findByRole('button', { name: 'Got it' })
    expect(apply()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Not quite' }))
    expect(apply()).toBeEnabled()
  })

  it('shows the status the pending schedule would land on', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByRole('button', { name: 'Mastered' }))

    expect(screen.getByRole('button', { name: 'Mastered' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('aria-pressed', 'false')
  })
})
