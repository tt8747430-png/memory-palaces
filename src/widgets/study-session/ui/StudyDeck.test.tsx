import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { makeCard } from '@/entities/card'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { StudyDeck } from './StudyDeck'
import type { StudyCard } from '../model/types'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

function studyCard(front: string, back: string, id = 'c1'): StudyCard {
  return {
    card: makeCard({ id, createdAt: CREATED, deckId: 'd1', front, back }),
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

  // Regression: `upcoming` is nearest-first, so depth has to count *up* with that index.
  // Inverting it drew the furthest card in the visible slot, so the card peeking out from behind
  // was never the card the next swipe promoted.
  it('peeks at the card the next swipe will actually promote', () => {
    renderWithProviders(
      <StudyDeck
        {...baseProps({
          upcoming: [studyCard('Next up', 'b', 'c2'), studyCard('After that', 'b', 'c3')],
        })}
      />,
    )

    const queued = [...document.querySelectorAll<HTMLElement>('[aria-hidden][inert]')].filter(
      (node) => node.style.zIndex !== '',
    )
    const nearest = queued.reduce((a, b) =>
      Number(a.style.zIndex) > Number(b.style.zIndex) ? a : b,
    )

    expect(nearest).toHaveTextContent('Next up')
    expect(nearest).not.toHaveTextContent('After that')
  })
})
