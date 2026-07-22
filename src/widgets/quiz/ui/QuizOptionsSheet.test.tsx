import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { QuizOptionsSheet } from './QuizOptionsSheet'

afterEach(cleanup)

function setup(overrides: Partial<Parameters<typeof QuizOptionsSheet>[0]> = {}) {
  const onQuizTimer = vi.fn()
  const onShuffleQuestions = vi.fn()
  renderWithProviders(
    <QuizOptionsSheet
      open
      onClose={vi.fn()}
      quizTimer={false}
      shuffleQuestions={false}
      onQuizTimer={onQuizTimer}
      onShuffleQuestions={onShuffleQuestions}
      {...overrides}
    />,
  )
  return { onQuizTimer, onShuffleQuestions }
}

describe('QuizOptionsSheet', () => {
  it('renders the quiz option switches in a titled sheet', async () => {
    setup()
    expect(await screen.findByText('Quiz options')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Auto-advance' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Shuffle questions' })).toBeInTheDocument()
  })

  it('toggles auto-advance and shuffle', async () => {
    const user = userEvent.setup()
    const { onQuizTimer, onShuffleQuestions } = setup()
    await user.click(await screen.findByRole('switch', { name: 'Auto-advance' }))
    expect(onQuizTimer).toHaveBeenCalledWith(true)
    await user.click(screen.getByRole('switch', { name: 'Shuffle questions' }))
    expect(onShuffleQuestions).toHaveBeenCalledWith(true)
  })
})
