import {
  makeQuestion,
  questionsForRoom,
  selectQuestions,
  type Question,
  type QuestionStore,
} from '@/entities/question'
import { nextOrder } from '@/shared/lib'
import { requireQuestion } from './require-question'

/** Command — copy a question into a fresh one appended to the room. */
export async function duplicateQuestion(store: QuestionStore, id: string): Promise<Question> {
  const original = requireQuestion(store, id)
  const order = nextOrder(questionsForRoom(selectQuestions(store.getState()), original.roomId))
  const copy = makeQuestion({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId: original.roomId,
    prompt: original.prompt,
    options: original.options,
    correctAnswer: original.correctAnswer,
    explanation: original.explanation,
    order,
  })
  await store.getState().save(copy)
  return copy
}
