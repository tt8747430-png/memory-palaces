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
    await user.click(await screen.findByRole('button', { name: /good/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'good')

    expect(await screen.findByText('Front b')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /show answer/i }))
    await user.click(await screen.findByRole('button', { name: /good/i }))

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("requeues a card graded 'again' to the back of the session", async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a'), studyCard('b')], { mode: 'type' })

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(await screen.findByRole('button', { name: /again/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'again')

    // 'a' goes to the back, so 'b' leads now; 'a' returns after it.
    expect(await screen.findByText('Front b')).toBeInTheDocument()
  })

  it('swaps the fixed footer from overview + reveal to grades on flip', async () => {
    const user = userEvent.setup()
    renderPanel([studyCard('a'), studyCard('b')])

    // Both cards are unseen, so the whole queue sits in the "New" bucket of the footer,
    // above the one primary action; the grade control is not up yet.
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/new/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: /show answer/i }))

    // The overview steps aside and the grade control takes the whole footer slot.
    expect(await screen.findByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.queryByText(/new/i)).toBeNull()
  })

  it('keeps the rebuilt text in place once solved and grades from there', async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a')], { mode: 'words' })

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(screen.getByRole('button', { name: 'a' }))

    // The reconstructed answer stays on the card — no swap to a separate answer view —
    // and only the footer flips to the grade control.
    expect(screen.getByText('Back a')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /good/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'good')
    expect(screen.queryByText('Back a')).toBeNull()
  })

  it('solves a card by typing the full answer in Type mode', async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a')], { mode: 'type' })

    await user.type(screen.getByPlaceholderText(/type the answer/i), 'Back a')

    // A word-perfect attempt flips the card; the grade control takes the footer.
    await user.click(await screen.findByRole('button', { name: /good/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'good')
  })

  it('reveals then grades a card in a non-flip recall mode', async () => {
    const user = userEvent.setup()
    const { onGrade } = renderPanel([studyCard('a'), studyCard('b')], { mode: 'type' })

    // The prompt is visible; the grade control only appears once the answer is revealed.
    expect(screen.getByText('Front a')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /good/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(await screen.findByRole('button', { name: /good/i }))
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
