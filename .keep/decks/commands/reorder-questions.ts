import { updateQuestion } from '@app/decks/model/question'
import type { QuestionStore } from '@app/decks/data/stores'

export async function reorderQuestions(store: QuestionStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.questions().map((question) => [question.id, question]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const question = byId.get(id)
      if (!question || question.order === index) return undefined
      return store.save(updateQuestion(question, { order: index }, now))
    }),
  )
}
