import type { Question } from './types'
import type { QuestionState } from './store'

export const selectQuestions = (state: QuestionState): Question[] => state.questions
export const selectIsReady = (state: QuestionState): boolean => state.status === 'ready'

export const questionsForDeck = (questions: Question[], deckId: string): Question[] =>
  questions.filter((question) => question.deckId === deckId)
