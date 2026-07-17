import type { Question } from '@/decks/model/question'
import type { QuestionStore } from '@/decks/data/stores'

export function requireQuestion(store: QuestionStore, id: string): Question {
  const question = store.questions().find((candidate) => candidate.id === id)
  if (!question) throw new Error(`Question not found: ${id}`)
  return question
}
