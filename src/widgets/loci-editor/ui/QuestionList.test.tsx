import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeQuestion, type Question } from '@/entities/question'
import { QuestionList } from './QuestionList'

afterEach(cleanup)

const question = (id: string, prompt: string, options: string[], correct: number): Question =>
  makeQuestion({
    id,
    createdAt: new Date(0).toISOString(),
    roomId: 'r1',
    prompt,
    options,
    correctAnswer: correct,
  })

function renderList(props: Partial<Parameters<typeof QuestionList>[0]> = {}) {
  const handlers = { onDelete: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      <QuestionList questions={[]} {...handlers} {...props} />
    </I18nextProvider>,
  )
  return handlers
}

describe('QuestionList', () => {
  it('shows an empty state when there are no questions', () => {
    renderList({ questions: [] })
    expect(screen.getByText(/no questions/i)).toBeInTheDocument()
  })

  it('renders the prompt and the correct answer', () => {
    renderList({ questions: [question('q', 'Capital of France?', ['Paris', 'Lyon'], 0)] })
    expect(screen.getByText('Capital of France?')).toBeInTheDocument()
    expect(screen.getByText(/Paris/)).toBeInTheDocument()
  })

  it('invokes onDelete for the targeted question', async () => {
    const user = userEvent.setup()
    const handlers = renderList({
      questions: [question('q', 'Capital of France?', ['Paris', 'Lyon'], 0)],
    })
    await user.click(screen.getByRole('button', { name: /delete question/i }))
    expect(handlers.onDelete).toHaveBeenCalledWith('q')
  })
})
