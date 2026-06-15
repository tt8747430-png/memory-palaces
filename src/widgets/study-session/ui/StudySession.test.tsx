import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeLocus } from '@/entities/locus'
import { StudySession } from './StudySession'
import type { StudyCard, StudyPrefs } from '../model/types'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

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

function renderSession(
  cards: StudyCard[],
  overrides: Partial<{
    onGrade: (id: string, grade: string) => void
    onComplete: () => void
    prefs: Partial<StudyPrefs>
  }> = {},
) {
  const onGrade = vi.fn(overrides.onGrade)
  const onComplete = vi.fn(overrides.onComplete)
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <StudySession
          cards={cards}
          title="Atrium"
          initialPrefs={overrides.prefs}
          onGrade={onGrade}
          onBack={() => {}}
          onComplete={onComplete}
          now={NOW}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onGrade, onComplete }
}

describe('StudySession', () => {
  it('flips and grades a review session through to completion', async () => {
    const user = userEvent.setup()
    const { onGrade, onComplete } = renderSession([studyCard('a'), studyCard('b')])

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
    const { onGrade } = renderSession([studyCard('a'), studyCard('b')])

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /again/i }))
    expect(onGrade).toHaveBeenCalledWith('a', 'again')

    // 'a' goes to the back, so 'b' leads now; 'a' returns after it.
    expect(await screen.findByText('Front b')).toBeInTheDocument()
  })

  it('navigates a browse session and finishes it', async () => {
    const user = userEvent.setup()
    renderSession([studyCard('a'), studyCard('b')], { prefs: { mode: 'browse' } })

    expect(screen.getByText('Front a')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next card/i }))
    expect(await screen.findByText('Front b')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /complete session/i }))
    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
  })

  it('shows an empty state for a deck with no cards', () => {
    renderSession([])
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
  })
})
