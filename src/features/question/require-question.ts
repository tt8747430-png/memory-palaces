import type { Question, QuestionStore } from '@/entities/question'

/** Read a question from the store's reactive state, or fail loudly. */
export function requireQuestion(store: QuestionStore, id: string): Question {
  const question = store.getState().questions.find((candidate) => candidate.id === id)
  if (!question) throw new Error(`Question not found: ${id}`)
  return question
}
