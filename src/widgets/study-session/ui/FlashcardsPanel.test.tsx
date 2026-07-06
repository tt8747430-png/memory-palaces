import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeLocus } from '@/entities/locus'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import type { StudyMode } from '@/entities/preferences'
import { FlashcardsPanel } from './FlashcardsPanel'
import type { StudyCard, StudyPrefs } from '../model/types'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

const DEFAULT_PREFS: StudyPrefs = { direction: 'front', shuffle: false, textToSpeech: false }

function studyCard(id: string): StudyCard {
  return {
    locus: makeLocus({
      id,
      createdAt: new Date(0).toISOString(),
      roomId: 'r1',
      front: `Front ${id}`,
      back: `Back ${id}`,
    }),
    palaceName: 'Forum',
    roomTitle: 'Atrium',
  }
}

function renderPanel(
  cards: StudyCard[],
  overrides: Partial<{
    onGrade: (id: string, grade: string) => void
    onComplete: () => void
    prefs: Partial<StudyPrefs>
    mode: StudyMode
    modeSheetOpen: boolean
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
          mode={overrides.mode ?? 'flip'}
          wordSpaces
          swipeConfig={DEFAULT_FLASHCARD_SWIPE}
          onGrade={onGrade}
          onModeChange={onModeChange}
          onBack={() => {}}
          onComplete={onComplete}
          optionsOpen={false}
          onOptionsOpenChange={() => {}}
          modeSheetOpen={overrides.modeSheetOpen ?? false}
          onModeSheetOpenChange={() => {}}
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
    const { onGrade, onComplete } = renderPanel([studyCard('a'), studyCard('b')], {
      mode: 'type',
    })

    expect(screen.getByText('Front a')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /good/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'good')

    expect(await screen.findByText('Front b')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /good/i }))

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("requeues a card graded 'again' to the back of the session", async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a'), studyCard('b')], { mode: 'type' })

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /again/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'again')

    // 'a' goes to the back, so 'b' leads now; 'a' returns after it.
    expect(await screen.findByText('Front b')).toBeInTheDocument()
  })

  it('shows the remaining-queue counts instead of a reveal button in flip mode', () => {
    renderPanel([studyCard('a'), studyCard('b')])

    // Tap-to-flip owns the reveal in flip mode; the footer carries the queue overview.
    expect(screen.queryByRole('button', { name: /show answer/i })).toBeNull()
    // Both cards are unseen, so the whole queue sits in the "new" bucket of the counter
    // (the card's own status chip says "New" too, hence the second match).
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getAllByText(/new/i)).toHaveLength(2)
  })

  it('reveals then grades a card in a non-flip recall mode', async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a'), studyCard('b')], { mode: 'type' })

    // The prompt is visible; the grade control only appears once the answer is revealed.
    expect(screen.getByText('Front a')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /good/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'good')

    expect(await screen.findByText('Front b')).toBeInTheDocument()
  })

  it('switches the study mode through the mode sheet', async () => {
    const user = userEvent.setup()
    const { onModeChange } = renderPanel([studyCard('a')], { mode: 'type', modeSheetOpen: true })

    await user.click(await screen.findByRole('button', { name: /rebuild/i }))
    expect(onModeChange).toHaveBeenCalledWith('words')
  })
})
