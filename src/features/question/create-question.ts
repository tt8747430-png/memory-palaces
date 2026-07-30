import {
  makeQuestion,
  type Question,
  questionsForDeck,
  type QuestionStore,
  selectQuestions,
} from '@/entities/question'
import { newId, nextOrder, nowIso } from '@/shared/lib'

export interface CreateQuestionInput {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export async function createQuestion(
  store: QuestionStore,
  deckId: string,
  input: CreateQuestionInput,
  now: number = Date.now(),
): Promise<Question> {
  const order = nextOrder(questionsForDeck(selectQuestions(store.getState()), deckId))
  const question = makeQuestion({
    ...input,
    id: newId(),
    createdAt: nowIso(now),
    deckId,
    order,
  })
  await store.getState().save(question)
  return question
}
