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
      stats: spacedStats.map((stat) => ({ ...stat, value: 0 })),
      onStudyAhead,
    })
    expect(screen.getByText(/caught up/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study ahead/i }))
    expect(onStudyAhead).toHaveBeenCalledOnce()
  })

  it('is never caught up under fast review — every card is always on offer', () => {
    renderCard({
      variant: 'fast',
      count: 0,
      countLabel: 'cards to study',
      stats: [
        { key: 'notStudied', label: 'Not studied', value: 0 },
        { key: 'notQuite', label: 'Not quite', value: 0 },
        { key: 'gotIt', label: 'Got it', value: 0 },
      ],
    })
    expect(screen.queryByText(/caught up/i)).toBeNull()
    expect(screen.getByText('Not studied')).toBeInTheDocument()
  })
})
