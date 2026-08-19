import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { type FastOutcome, makeCard } from '@/entities/card'
import { DEFAULT_FLASHCARD_SWIPE_BY_MODE } from '@/shared/config/flashcard-swipe'
import { DEFAULT_CARD_STYLE, type LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { FlashcardsPanel } from './FlashcardsPanel'
import type { Grade, StudyCard, StudyPrefs } from '../model/types'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

const DEFAULT_PREFS: StudyPrefs = {
  direction: 'front',
  shuffle: false,
  textToSpeech: false,
  newCardsPerDay: 10,
  maxCardsPerDay: 3000,
  cardStyle: DEFAULT_CARD_STYLE,
}

async function tap(name: RegExp | string) {
  fireEvent.click(await screen.findByRole('button', { name }, { timeout: 3000 }))
}

function studyCard(id: string): StudyCard {
  return {
    card: makeCard({
      id,
      createdAt: new Date(0).toISOString(),
      deckId: 'd1',
      front: `Front ${id}`,
      back: `Back ${id}`,
    }),
    deckName: 'Forum',
    deckPath: 'Forum',
  }
}

function renderPanel(
  cards: StudyCard[],
  overrides: Partial<{
    onGrade: (id: string, grade: Grade) => void
    onComplete: () => void
    prefs: Partial<StudyPrefs>
    mode: StudyMode
    algorithm: LearningAlgorithm
    onAnswer: (id: string, outcome: FastOutcome) => void
  }> = {},
) {
  const onGrade = vi.fn(overrides.onGrade)
  const onComplete = vi.fn(overrides.onComplete)
  const onModeChange = vi.fn()

  function Harness() {
    const [mode, setMode] = useState<StudyMode>(overrides.mode ?? 'blur')
    return (
      <FlashcardsPanel
        cards={cards}
        title="Forum"
        prefs={{ ...DEFAULT_PREFS, ...overrides.prefs }}
        algorithm={overrides.algorithm ?? 'spaced'}
        mode={mode}
        wordSpaces
        shakeToUndo={false}
        swipeByMode={DEFAULT_FLASHCARD_SWIPE_BY_MODE}
        onGrade={onGrade}
        onAnswer={overrides.onAnswer}
        onModeChange={(next) => {
          onModeChange(next)
          setMode(next)
        }}
        onBack={() => {}}
        onComplete={onComplete}
        now={NOW}
      />
    )
  }

  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <Harness />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onGrade, onComplete, onModeChange }
}

describe('FlashcardsPanel', () => {
  it('reveals and grades a review session through to completion', async () => {
    const user = userEvent.setup()
    const { onGrade, onComplete } = renderPanel([studyCard('a'), studyCard('b')])

    expect(screen.getByRole('heading', { name: 'Front a' })).toBeInTheDocument()

    await tap(/show answer/i)
    await tap(/good/i)
    expect(onGrade).toHaveBeenCalledWith('a', 'good')

    expect(await screen.findByRole('heading', { name: 'Front b' })).toBeInTheDocument()
    await tap(/show answer/i)
    await tap(/good/i)

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("requeues a card graded 'again' to the back of the session", async () => {
    const { onGrade } = renderPanel([studyCard('a'), studyCard('b')])

    await tap(/show answer/i)
    await tap(/again/i)
    expect(onGrade).toHaveBeenCalledWith('a', 'again')

    expect(await screen.findByRole('heading', { name: 'Front b' })).toBeInTheDocument()
  })

  it('swaps the fixed footer from overview to grades when the card turns both ways', async () => {
    renderPanel([studyCard('a'), studyCard('b')])

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/new/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()

    await tap(/show answer/i)
    expect(await screen.findByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.queryByText(/new/i)).toBeNull()

    await tap(/show front/i)
    expect(await screen.findByText(/new/i)).toBeInTheDocument()
  })

  it('keeps the rebuilt text in place once solved and grades from there', async () => {
    const { onGrade } = renderPanel([studyCard('a')], { mode: 'words' })

    await tap('Back')
    await tap('a')

    expect(screen.getAllByText('Back a').length).toBeGreaterThan(0)
    await tap(/good/i)
    expect(onGrade).toHaveBeenCalledWith('a', 'good')
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()
  })

  it('solves a card by typing the full answer in Type mode', async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a')], { mode: 'type' })

    await user.type(screen.getByPlaceholderText(/type the answer/i), 'Back a')

    await tap(/good/i)
    expect(onGrade).toHaveBeenCalledWith('a', 'good')
  })

  it('has no reveal shortcut in Type mode — the answer must be typed', async () => {
    renderPanel([studyCard('a')], { mode: 'type' })

    expect(screen.getByRole('heading', { name: 'Front a' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^show$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reveal/i })).toBeNull()
  })

  it('clears a solved Rebuild with Reset and returns to the overview', async () => {
    renderPanel([studyCard('a')], { mode: 'words' })

    await tap('Back')
    await tap('a')
    expect(await screen.findByRole('button', { name: /good/i })).toBeInTheDocument()

    await tap(/^reset$/i)
    await waitFor(() => expect(screen.queryByRole('button', { name: /good/i })).toBeNull())
  })

  it('switches the study mode through the mode sheet', async () => {
    const user = userEvent.setup()
    const { onModeChange } = renderPanel([studyCard('a')], { mode: 'type' })

    fireEvent.click(screen.getAllByRole('button', { name: /change study mode/i })[0]!)
    await user.click(await screen.findByRole('button', { name: /rebuild/i }))
    expect(onModeChange).toHaveBeenCalledWith('words')
  })

  it('lands the new mode on its front face when switched from a flipped card', async () => {
    const user = userEvent.setup()
    renderPanel([studyCard('a')], { mode: 'blur' })

    await tap(/show answer/i)
    expect(await screen.findByRole('button', { name: /good/i })).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /change study mode/i })[0]!)
    await user.click(await screen.findByRole('button', { name: /type the answer from memory/i }))

    expect(await screen.findByPlaceholderText(/type the answer/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /good/i })).toBeNull())
  })

  it('shows no "tap to see" affordance once a card is solved — the front is terminal', async () => {
    renderPanel([studyCard('a')], { mode: 'words' })

    await tap('Back')
    await tap('a')

    expect(await screen.findByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.queryByText(/tap to see/i)).toBeNull()
  })
})

describe('FlashcardsPanel under fast review', () => {
  it('answers with Not quite and Got it instead of grades', async () => {
    renderPanel([studyCard('a'), studyCard('b')], { algorithm: 'fast' })
    await tap(/show answer/i)
    expect(await screen.findByRole('button', { name: 'Not quite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^again$/i })).toBeNull()
  })

  it('grades as usual under spaced repetition', async () => {
    renderPanel([studyCard('a'), studyCard('b')], { algorithm: 'spaced' })
    await tap(/show answer/i)
    expect(await screen.findByRole('button', { name: /again/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Not quite' })).toBeNull()
  })

  it('reports each answer to the page', async () => {
    const onAnswer = vi.fn()
    renderPanel([studyCard('a'), studyCard('b')], { algorithm: 'fast', onAnswer })
    await tap(/show answer/i)
    await tap('Got it')
    expect(onAnswer).toHaveBeenCalledWith('a', 'gotIt')
  })
})

describe('FlashcardsPanel progress header', () => {
  it('derives the count from the session rather than being told it', async () => {
    renderPanel([studyCard('a'), studyCard('b')])
    expect(await screen.findByText('/2')).toBeInTheDocument()
    expect(screen.getByTestId('session-progress-fill')).toHaveStyle({ width: '0%' })
    await tap(/show answer/i)
    await tap(/good/i)
    await waitFor(() =>
      expect(screen.getByTestId('session-progress-fill')).toHaveStyle({ width: '50%' }),
    )
  })
})

describe('FlashcardsPanel session header', () => {
  it('opens the options sheet from the header', async () => {
    renderPanel([studyCard('a')])
    const headerOptions = await screen.findAllByRole('button', { name: 'Study options' })
    fireEvent.click(headerOptions[0]!)
    expect(await screen.findByText('This card')).toBeInTheDocument()
  })
})
