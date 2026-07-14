import { type QuestionStore, updateQuestion } from '@/entities/question'

export async function reorderQuestions(store: QuestionStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().questions.map((question) => [question.id, question]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const question = byId.get(id)
      if (!question || question.order === index) return undefined
      return store.getState().save(updateQuestion(question, { order: index }, now))
    }),
  )
}
