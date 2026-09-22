import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeCard } from '@/entities/card'
import { makeQuestion } from '@/entities/question'
import type { SwipeConfig } from '@/shared/config/swipe'
import type { ActionHandlers } from '@/shared/ui'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardRow } from './CardRow'
import type { RowEvents } from './ContentRow'
import { QuestionRow } from './QuestionRow'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()
const NO_SWIPE: SwipeConfig = { leading: [], trailing: [] }

const handlers = (over: ActionHandlers = {}): ActionHandlers => ({
  flag: { onAction: vi.fn() },
  known: { onAction: vi.fn() },
  move: { onAction: vi.fn() },
  delete: { onAction: vi.fn() },
  ...over,
})

const events = (over: Partial<RowEvents> = {}): RowEvents => ({
  toggleSelect: vi.fn(),
  requestSelect: vi.fn(),
  open: vi.fn(),
  ...over,
})

/**
 * A row draws its rails from the first swipe on, not from mount — so a test that reads them moves
 * the row first, as a thumb would.
 */
async function swipeOpen(text: string) {
  const sled = screen.getByText(text).closest('[class*="rounded-card"]')!.parentElement!
  const finger = { pointerId: 1, pointerType: 'touch', isPrimary: true }
  fireEvent.pointerDown(sled, { ...finger, buttons: 1, clientX: 300, clientY: 10 })
  fireEvent.pointerMove(sled, { ...finger, buttons: 1, clientX: 280, clientY: 10 })
  fireEvent.pointerCancel(sled, { ...finger, buttons: 0, clientX: 280, clientY: 10 })
  await act(async () => void (await new Promise(requestAnimationFrame)))
}

function cardProps(
  overrides: Partial<Parameters<typeof CardRow>[0]> = {},
): Parameters<typeof CardRow>[0] {
  return {
    card: makeCard({
      id: 'c1',
      createdAt: CREATED,
      deckId: 'd1',
      front: 'Front text',
      back: 'Back text',
    }),
    index: 0,
    algorithm: 'spaced',
    selectMode: false,
    selected: false,
    reorderable: false,
    swipe: NO_SWIPE,
    actionsFor: () => handlers(),
    events: events(),
    onOpenActions: vi.fn(),
    ...overrides,
  }
}

describe('CardRow', () => {
  it('renders the card position, front and back', () => {
    renderWithProviders(<CardRow {...cardProps()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Front text')).toBeInTheDocument()
    expect(screen.getByText('Back text')).toBeInTheDocument()
  })

  it('opens the card when the row is tapped', async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    renderWithProviders(<CardRow {...cardProps({ events: events({ open }) })} />)
    await user.click(screen.getByText('Front text'))
    expect(open).toHaveBeenCalledWith('c1')
  })

  it('opens the card actions sheet from the overflow control', async () => {
    const user = userEvent.setup()
    const onOpenActions = vi.fn()
    const open = vi.fn()
    const requestSelect = vi.fn()
    renderWithProviders(
      <CardRow {...cardProps({ onOpenActions, events: events({ open, requestSelect }) })} />,
    )

    await user.click(screen.getByRole('button', { name: 'Card actions' }))

    expect(onOpenActions).toHaveBeenCalledWith('c1')
    expect(open).not.toHaveBeenCalled()
    expect(requestSelect).not.toHaveBeenCalled()
  })

  it('hides the SRS chip under fast review, where nothing is scheduled', () => {
    renderWithProviders(<CardRow {...cardProps({ algorithm: 'spaced' })} />)
    expect(screen.getByText('New')).toBeInTheDocument()
    cleanup()
    renderWithProviders(<CardRow {...cardProps({ algorithm: 'fast' })} />)
    expect(screen.queryByText('New')).toBeNull()
  })

  it('chips a reversed and a frozen card', () => {
    renderWithProviders(
      <CardRow {...cardProps({ card: { ...cardProps().card, reversed: true, frozen: true } })} />,
    )
    expect(screen.getByText('Reversed')).toBeInTheDocument()
    expect(screen.getByText('Frozen')).toBeInTheDocument()
  })

  it("puts the learner's chosen actions on the rails", async () => {
    const swipe: SwipeConfig = { leading: ['known'], trailing: ['flag', 'delete'] }
    renderWithProviders(<CardRow {...cardProps({ swipe })} />)
    await swipeOpen('Front text')
    expect(screen.getByLabelText('Mastered')).toBeInTheDocument()
    expect(screen.getByLabelText('Flag')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete')).toBeInTheDocument()
  })

  it('leaves a rail action out when the card cannot do it', async () => {
    const swipe: SwipeConfig = { leading: [], trailing: ['grade', 'delete'] }
    renderWithProviders(<CardRow {...cardProps({ swipe })} />)
    await swipeOpen('Front text')
    expect(screen.queryByLabelText('Grade')).toBeNull()
    expect(screen.getByLabelText('Delete')).toBeInTheDocument()
  })

  it('toggles selection in select mode and shows the flag indicator', async () => {
    const user = userEvent.setup()
    const toggleSelect = vi.fn()
    const card = makeCard({
      id: 'c1',
      createdAt: CREATED,
      deckId: 'd1',
      front: 'Front text',
      back: 'Back text',
      flagged: true,
    })
    renderWithProviders(
      <CardRow {...cardProps({ card, selectMode: true, events: events({ toggleSelect }) })} />,
    )

    expect(screen.getByLabelText('Flagged')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Card actions' })).toBeNull()
    await user.click(screen.getByText('Front text'))
    expect(toggleSelect).toHaveBeenCalledWith('c1')
  })
})

function questionProps(
  overrides: Partial<Parameters<typeof QuestionRow>[0]> = {},
): Parameters<typeof QuestionRow>[0] {
  return {
    question: makeQuestion({
      id: 'q1',
      createdAt: CREATED,
      deckId: 'd1',
      prompt: 'Which planet is closest to the Sun?',
      options: ['Mercury', 'Venus'],
      correctAnswer: 0,
    }),
    index: 0,
    selectMode: false,
    selected: false,
    reorderable: false,
    swipe: NO_SWIPE,
    events: events(),
    actions: { edit: vi.fn(), duplicate: vi.fn(), remove: vi.fn() },
    ...overrides,
  }
}

describe('QuestionRow', () => {
  it('renders the prompt and each option', () => {
    renderWithProviders(<QuestionRow {...questionProps()} />)
    expect(screen.getByText('Which planet is closest to the Sun?')).toBeInTheDocument()
    expect(screen.getByText('Mercury')).toBeInTheDocument()
    expect(screen.getByText('Venus')).toBeInTheDocument()
  })

  it('runs overflow menu actions', async () => {
    const user = userEvent.setup()
    const remove = vi.fn()
    const props = questionProps({ actions: { edit: vi.fn(), duplicate: vi.fn(), remove } })
    renderWithProviders(<QuestionRow {...props} />)
    await user.click(screen.getByRole('button', { name: 'Card actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(remove).toHaveBeenCalledWith(props.question)
  })
})

describe('a memoized row', () => {
  it('does not draw again when the list re-renders around it with nothing of its own changed', () => {
    const actionsFor = vi.fn(() => handlers())
    const props = cardProps({ actionsFor })
    const { rerender } = renderWithProviders(<CardRow {...props} />)
    rerender(<CardRow {...props} />)
    rerender(<CardRow {...props} selected={false} />)
    // One catalog built for the one card — not one per render of the list.
    expect(actionsFor).toHaveBeenCalledTimes(1)
  })

  it('draws again when its own card changes', () => {
    const actionsFor = vi.fn(() => handlers())
    const props = cardProps({ actionsFor })
    const { rerender } = renderWithProviders(<CardRow {...props} />)
    rerender(<CardRow {...props} card={{ ...props.card, front: 'Edited' }} />)
    expect(screen.getByText('Edited')).toBeInTheDocument()
    expect(actionsFor).toHaveBeenCalledTimes(2)
  })
})
