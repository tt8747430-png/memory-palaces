import { type QuestionStore, updateQuestion } from '@/entities/question'

/**
 * Command — persist a manual question order within a deck. Given the question ids in their
 * new order, write each question's `order` to match its index. Only changed questions are
 * saved, so a no-op drag costs nothing. Used by the content editor's drag-to-reorder; the
 * caller passes the ids of one deck's questions in their final order.
 */
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
