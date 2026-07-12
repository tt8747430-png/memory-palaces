import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { DEFAULT_FLASHCARD_SWIPE_BY_MODE } from '@/shared/config/flashcard-swipe'
import type { StudyMode } from '@/entities/preferences'
import { FlashcardsPanel } from './FlashcardsPanel'
import type { StudyCard, StudyPrefs } from '../model/types'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

const DEFAULT_PREFS: StudyPrefs = { direction: 'front', shuffle: false, textToSpeech: false }

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
    onGrade: (id: string, grade: string) => void
    onComplete: () => void
    prefs: Partial<StudyPrefs>
    mode: StudyMode
  }> = {},
) {
  const onGrade = vi.fn(overrides.onGrade)
  const onComplete = vi.fn(overrides.onComplete)
  const onModeChange = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <FlashcardsPanel
          cards={cards}
          prefs={{ ...DEFAULT_PREFS, ...overrides.prefs }}
          mode={overrides.mode ?? 'blur'}
          wordSpaces
          shakeToUndo={false}
          swipeByMode={DEFAULT_FLASHCARD_SWIPE_BY_MODE}
          onGrade={onGrade}
          onModeChange={onModeChange}
          onBack={() => {}}
          onComplete={onComplete}
          now={NOW}
        />
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
})
