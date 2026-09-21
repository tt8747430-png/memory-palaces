import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { StudyOverviewCard, type StudyOverviewCardProps } from './StudyOverviewCard'

afterEach(cleanup)

const spacedStats = [
  { key: 'new', label: 'New', value: 2 },
  { key: 'learning', label: 'Learning', value: 1 },
  { key: 'known', label: 'Mastered', value: 5 },
]

function renderCard(props: Partial<StudyOverviewCardProps> = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <StudyOverviewCard
        variant="spaced"
        count={8}
        caughtUp={false}
        countLabel="Cards for today"
        stats={spacedStats}
        onStudy={vi.fn()}
        {...props}
      />
    </I18nextProvider>,
  )
}

describe('StudyOverviewCard', () => {
  it('shows the due count and fires onStudy', async () => {
    const onStudy = vi.fn()
    renderCard({ onStudy })
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Cards for today')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study cards/i }))
    expect(onStudy).toHaveBeenCalledOnce()
  })

  it('labels each stat it is given', () => {
    renderCard()
    for (const label of ['New', 'Learning', 'Mastered']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows a caught-up state and offers study-ahead at 0 due', async () => {
    const onStudyAhead = vi.fn()
    renderCard({
      count: 0,
      caughtUp: true,
      stats: spacedStats.map((stat) => ({ ...stat, value: 0 })),
      onStudyAhead,
    })
    expect(screen.getByText(/caught up/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study ahead/i }))
    expect(onStudyAhead).toHaveBeenCalledOnce()
  })

  it('keeps its buckets when a Fast deck has nothing to offer for another reason', () => {
    // Every card frozen: none left to study, none got right either. "Caught up" would be a lie,
    // and the count alone cannot tell the two apart — which is why the card is told.
    renderCard({
      variant: 'fast',
      count: 0,
      caughtUp: false,
      countLabel: 'cards to study',
      stats: [
        { key: 'notStudied', label: 'Not studied', value: 7 },
        { key: 'notQuite', label: 'Not quite', value: 0 },
        { key: 'gotIt', label: 'Got it', value: 0 },
      ],
    })
    expect(screen.queryByText(/got it/i)).not.toBeNull()
    expect(screen.getByText('Not studied')).toBeInTheDocument()
  })

  it('says the Fast pass is done when every card has been got right, and offers another', async () => {
    const onStudyAhead = vi.fn()
    renderCard({
      variant: 'fast',
      count: 0,
      caughtUp: true,
      countLabel: 'cards to study',
      onStudyAhead,
      stats: [
        { key: 'notStudied', label: 'Not studied', value: 0 },
        { key: 'notQuite', label: 'Not quite', value: 0 },
        { key: 'gotIt', label: 'Got it', value: 12 },
      ],
    })
    expect(screen.getByText(/got right/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study again/i }))
    expect(onStudyAhead).toHaveBeenCalledOnce()
  })

  it('keeps the buckets on the card while a Fast pass still has cards left', () => {
    renderCard({
      variant: 'fast',
      count: 3,
      countLabel: 'cards to study',
      stats: [
        { key: 'notStudied', label: 'Not studied', value: 2 },
        { key: 'notQuite', label: 'Not quite', value: 1 },
        { key: 'gotIt', label: 'Got it', value: 9 },
      ],
    })
    expect(screen.queryByText(/got right/i)).toBeNull()
    expect(screen.getByText('Not studied')).toBeInTheDocument()
  })
})
