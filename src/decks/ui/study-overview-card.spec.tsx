import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { StudyOverviewCard, type StudyOverviewCardProps } from './study-overview-card'

afterEach(cleanup)

function renderCard(props: StudyOverviewCardProps) {
  return render(
    <I18nextProvider i18n={i18n}>
      <StudyOverviewCard {...props} />
    </I18nextProvider>,
  )
}

describe('StudyOverviewCard', () => {
  it('shows the due count and fires onStudy', async () => {
    const onStudy = vi.fn()
    renderCard({ count: 8, breakdown: { new: 2, learning: 1, known: 5 }, onStudy })
    expect(screen.getByText('8')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study cards/i }))
    expect(onStudy).toHaveBeenCalledOnce()
  })

  it('shows a caught-up state and offers study-ahead at 0 due', async () => {
    const onStudyAhead = vi.fn()
    renderCard({
      count: 0,
      breakdown: { new: 0, learning: 0, known: 0 },
      onStudy: vi.fn(),
      onStudyAhead,
    })
    expect(screen.getByText(/caught up/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study ahead/i }))
    expect(onStudyAhead).toHaveBeenCalledOnce()
  })
})
