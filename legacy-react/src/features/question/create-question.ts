import {
  makeQuestion,
  type Question,
  questionsForDeck,
  type QuestionStore,
  selectQuestions,
} from '@/entities/question'
import { nextOrder } from '@/shared/lib'

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
): Promise<Question> {
  const order = nextOrder(questionsForDeck(selectQuestions(store.getState()), deckId))
  const question = makeQuestion({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    deckId,
    order,
  })
  await store.getState().save(question)
  return question
}
