import {
  makeQuestion,
  type Question,
  questionsForDeck,
  type QuestionStore,
  selectQuestions,
} from '@/entities/question'
import { nextOrder } from '@/shared/lib'
import { requireQuestion } from './require-question'

export async function duplicateQuestion(store: QuestionStore, id: string): Promise<Question> {
  const original = requireQuestion(store, id)
  const order = nextOrder(questionsForDeck(selectQuestions(store.getState()), original.deckId))
  const copy = makeQuestion({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    deckId: original.deckId,
    prompt: original.prompt,
    options: original.options,
    correctAnswer: original.correctAnswer,
    explanation: original.explanation,
    order,
  })
  await store.getState().save(copy)
  return copy
}
