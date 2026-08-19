import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { makeCard } from '@/entities/card'
import { DEFAULT_CARD_STYLE } from '@/entities/deck'
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
    cardStyle: DEFAULT_CARD_STYLE,
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
    renderWithProviders(<StudyDeck {...baseProps()} />)
    expect(screen.getAllByText('Prompt front').length).toBeGreaterThan(0)
  })

  it('uses the definition as the prompt when studying back-first', () => {
    renderWithProviders(
      <StudyDeck {...baseProps({ card: studyCard('Term', 'Definition'), direction: 'back' })} />,
    )
    expect(screen.getAllByText('Definition').length).toBeGreaterThan(0)
  })

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

  it('draws the queued cards as whole cards — the same face, controls and all', () => {
    renderWithProviders(
      <StudyDeck
        {...baseProps({
          canSpeak: true,
          upcoming: [studyCard('Next up', 'b', 'c2')],
        })}
      />,
    )

    const queued = [...document.querySelectorAll<HTMLElement>('[aria-hidden][inert]')].find(
      (node) => node.textContent?.includes('Next up'),
    )
    expect(queued).toBeDefined()
    expect(queued!.querySelector('[aria-label="Change study mode"]')).not.toBeNull()
    expect(queued!.querySelector('[aria-label="Study options"]')).not.toBeNull()
    expect(queued!.querySelector('[aria-label="Read aloud"]')).not.toBeNull()
    expect(queued).toHaveTextContent('Tap to reveal')
  })

  it('keeps queued cards out of reach — only the card in play can act', () => {
    const modeButtons = () => screen.queryAllByRole('button', { name: 'Change study mode' }).length

    const alone = renderWithProviders(<StudyDeck {...baseProps()} />)
    const reachable = modeButtons()
    alone.unmount()

    renderWithProviders(
      <StudyDeck {...baseProps({ upcoming: [studyCard('Next up', 'b', 'c2')] })} />,
    )
    expect(modeButtons()).toBe(reachable)
  })
})

describe('StudyDeck reversed cards', () => {
  it('asks a reversed card back-first even in a front-first deck', () => {
    const reversed: StudyCard = {
      ...studyCard('Prompt front', 'Answer back'),
      card: { ...studyCard('Prompt front', 'Answer back').card, reversed: true },
    }
    renderWithProviders(<StudyDeck {...baseProps({ card: reversed, direction: 'front' })} />)
    expect(screen.getByRole('heading', { name: 'Answer back' })).toBeInTheDocument()
  })
})
