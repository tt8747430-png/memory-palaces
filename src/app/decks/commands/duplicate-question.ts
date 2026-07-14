import { makeQuestion, questionsForDeck } from '@app/decks/model/question'
import type { Question } from '@app/decks/model/question'
import type { QuestionStore } from '@app/decks/data/stores'
import { nextOrder } from '@app/shared/domain'
import { requireQuestion } from './require-question'

export async function duplicateQuestion(store: QuestionStore, id: string): Promise<Question> {
  const original = requireQuestion(store, id)
  const order = nextOrder(questionsForDeck(store.questions(), original.deckId))
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
  await store.save(copy)
  return copy
}
