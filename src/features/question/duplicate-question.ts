import {
  makeQuestion,
  type Question,
  questionsForDeck,
  type QuestionStore,
  selectQuestions,
} from '@/entities/question'
import { newId, nextOrder, nowIso } from '@/shared/lib'
import { requireQuestion } from './question-commands'

export async function duplicateQuestion(
  store: QuestionStore,
  id: string,
  now: number = Date.now(),
): Promise<Question> {
  const original = requireQuestion(store, id)
  const order = nextOrder(questionsForDeck(selectQuestions(store.getState()), original.deckId))
  const copy = makeQuestion({
    id: newId(),
    createdAt: nowIso(now),
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
