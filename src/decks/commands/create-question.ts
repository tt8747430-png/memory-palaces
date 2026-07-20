import { makeQuestion, questionsForDeck } from '@/decks/model/question'
import type { Question } from '@/decks/model/question'
import type { QuestionStore } from '@/decks/data/stores'
import { nextOrder } from '@/shared/domain'

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
  const order = nextOrder(questionsForDeck(store.questions(), deckId))
  const question = makeQuestion({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    deckId,
    order,
  })
  await store.save(question)
  return question
}
