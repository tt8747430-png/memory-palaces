import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { StudySessionResult } from './StudySessionResult'

afterEach(cleanup)

describe('StudySessionResult', () => {
  it('summarises the study session and its reviewed count', () => {
    renderWithProviders(
      <StudySessionResult summary={{ graded: 8, known: 5, learning: 3 }} onDone={() => {}} />,
    )
    expect(screen.getByRole('heading', { name: 'Study session complete' })).toBeInTheDocument()
    expect(screen.getByText('8 cards reviewed')).toBeInTheDocument()
    // A tile is a figure under its label, not a sentence: the study session's numbers read at a glance.
    expect(screen.getByText('Mastered').previousElementSibling).toHaveTextContent('5')
    expect(screen.getByText('Still learning').previousElementSibling).toHaveTextContent('3')
    expect(screen.getByText('Reviewed').previousElementSibling).toHaveTextContent('8')
  })

  it('leaves the tiles off a study session that graded nothing, rather than reporting zeroes', () => {
    renderWithProviders(
      <StudySessionResult summary={{ graded: 0, known: 0, learning: 0 }} onDone={() => {}} />,
    )
    expect(screen.queryByText('Mastered')).not.toBeInTheDocument()
  })

  it('fires onDone from the primary action', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    renderWithProviders(
      <StudySessionResult summary={{ graded: 1, known: 0, learning: 0 }} onDone={onDone} />,
    )
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
