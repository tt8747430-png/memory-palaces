import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { QuizQuestion } from '@/features/quiz'
import { QuizSession } from './QuizSession'

afterEach(cleanup)

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Capital of France?',
    options: ['Paris', 'Rome'],
    correctAnswer: 0,
    deckName: 'Geography',
  },
  {
    id: 'q2',
    prompt: '2 + 2?',
    options: ['3', '4'],
    correctAnswer: 1,
    deckName: 'Maths',
  },
]

function renderQuiz(questions: QuizQuestion[] = QUESTIONS) {
  const onComplete = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <QuizSession
          questions={questions}
          title="Forum Quiz"
          onBack={() => {}}
          onComplete={onComplete}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onComplete }
}

describe('QuizSession', () => {
  it('scores answers and completes with an accuracy summary', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderQuiz()

    expect(screen.getByText('Capital of France?')).toBeInTheDocument()
    // Submitting is blocked until an option is chosen.
    expect(screen.getByRole('button', { name: /select an answer/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /paris/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    expect(screen.getByText(/correct/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByText('2 + 2?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /4$/ }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(screen.getByRole('button', { name: /see results/i }))

    expect(await screen.findByText(/quiz complete/i)).toBeInTheDocument()
    expect(screen.getByText('2 / 2 correct')).toBeInTheDocument()
    expect(screen.getByText('100% accuracy')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onComplete).toHaveBeenCalledWith({ score: 2, total: 2, accuracy: 100 })
  })

  it('reveals the right answer and breaks no streak on a wrong choice', async () => {
    const user = userEvent.setup()
    renderQuiz()

    await user.click(screen.getByRole('button', { name: /rome/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
  })

  it('shows an empty state when the deck has no questions', () => {
    renderQuiz([])
    expect(screen.getByText(/no questions yet/i)).toBeInTheDocument()
  })
})
