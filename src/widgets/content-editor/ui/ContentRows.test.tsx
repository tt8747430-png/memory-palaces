import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeCard } from '@/entities/card'
import { makeQuestion } from '@/entities/question'
import type { SwipeConfig } from '@/shared/config/swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardRow, QuestionRow } from './ContentRows'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()
const NO_SWIPE: SwipeConfig = { leading: [], trailing: [] }

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
    selectMode: false,
    selected: false,
    reorderable: false,
    swipe: NO_SWIPE,
    onToggleSelect: vi.fn(),
    onRequestSelect: vi.fn(),
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onToggleFlag: vi.fn(),
    onMarkKnown: vi.fn(),
    onResetSrs: vi.fn(),
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
    const onOpen = vi.fn()
    renderWithProviders(<CardRow {...cardProps({ onOpen })} />)
    await user.click(screen.getByText('Front text'))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('runs overflow menu actions', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(<CardRow {...cardProps({ onEdit, onDelete })} />)

    await user.click(screen.getByRole('button', { name: 'Card actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Card actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('toggles selection in select mode and shows the flag indicator', async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()
    const card = makeCard({
      id: 'c1',
      createdAt: CREATED,
      deckId: 'd1',
      front: 'Front text',
      back: 'Back text',
      flagged: true,
    })
    renderWithProviders(<CardRow {...cardProps({ card, selectMode: true, onToggleSelect })} />)

    expect(screen.getByLabelText('Flagged')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Card actions' })).toBeNull()
    await user.click(screen.getByText('Front text'))
    expect(onToggleSelect).toHaveBeenCalledTimes(1)
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
    onToggleSelect: vi.fn(),
    onRequestSelect: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
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
    const onDelete = vi.fn()
    renderWithProviders(<QuestionRow {...questionProps({ onDelete })} />)
    await user.click(screen.getByRole('button', { name: 'Card actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
