import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import {
  createQuestionStore,
  makeQuestion,
  type Question,
  QuestionStoreContext,
} from '@/entities/question'
import { QuizPage } from './QuizPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderQuiz(deckId = 'd1') {
  const deckRepo = new InMemoryRepository<Deck>([
    makeDeck({ id: 'd1', createdAt: at(0), name: 'Forum' }),
  ])
  const questionRepo = new InMemoryRepository<Question>([
    makeQuestion({
      id: 'q1',
      createdAt: at(1),
      deckId: 'd1',
      prompt: 'Capital of France?',
      options: ['Paris', 'Rome'],
      correctAnswer: 0,
    }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <DeckStoreContext value={createDeckStore(deckRepo)}>
          <QuestionStoreContext value={createQuestionStore(questionRepo)}>
            <QuizPage deckId={deckId} onBack={() => {}} />
          </QuestionStoreContext>
        </DeckStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('QuizPage', () => {
  it('builds the quiz from the deck subtree questions', async () => {
    renderQuiz()
    expect(await screen.findByText('Forum Quiz')).toBeInTheDocument()
    expect(screen.getByText('Capital of France?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /paris/i })).toBeInTheDocument()
  })

  it('answers a question and reveals feedback', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await screen.findByText('Capital of France?')
    await user.click(screen.getByRole('button', { name: /paris/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown deck', async () => {
    renderQuiz('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
