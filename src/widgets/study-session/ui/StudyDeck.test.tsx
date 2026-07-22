import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { makeCard } from '@/entities/card'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { StudyDeck } from './StudyDeck'
import type { StudyCard } from '../model/types'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

function studyCard(front: string, back: string): StudyCard {
  return {
    card: makeCard({ id: 'c1', createdAt: CREATED, deckId: 'd1', front, back }),
    deckName: 'Deck',
    deckPath: 'Deck',
  }
}

function baseProps(
  overrides: Partial<Parameters<typeof StudyDeck>[0]> = {},
): Parameters<typeof StudyDeck>[0] {
  return {
    card: studyCard('Prompt front', 'Answer back'),
    mode: 'blur',
    direction: 'front',
    wordSpaces: false,
    typeInitialsOnly: false,
    flipped: false,
    swipeConfig: DEFAULT_FLASHCARD_SWIPE,
    canSpeak: false,
    onFlip: vi.fn(),
    onReveal: vi.fn(),
    onUnflip: vi.fn(),
    onCommit: vi.fn(),
    onSpeak: vi.fn(),
    onChangeMode: vi.fn(),
    onOpenGear: vi.fn(),
    ...overrides,
  }
}

describe('StudyDeck', () => {
  it('renders the current card prompt', () => {
    // In blur mode the prompt shows on both the front face and the back face's header.
    renderWithProviders(<StudyDeck {...baseProps()} />)
    expect(screen.getAllByText('Prompt front').length).toBeGreaterThan(0)
  })

  it('uses the definition as the prompt when studying back-first', () => {
    renderWithProviders(
      <StudyDeck {...baseProps({ card: studyCard('Term', 'Definition'), direction: 'back' })} />,
    )
    expect(screen.getAllByText('Definition').length).toBeGreaterThan(0)
  })
})
