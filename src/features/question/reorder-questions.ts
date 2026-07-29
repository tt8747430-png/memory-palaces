import { nowIso, reorderById } from '@/shared/lib'
import { type QuestionStore, updateQuestion } from '@/entities/question'

export function reorderQuestions(store: QuestionStore, orderedIds: string[]): Promise<void> {
  const now = nowIso()
  return reorderById(store.getState().questions, orderedIds, (question, order) =>
    store.getState().save(updateQuestion(question, { order }, now)),
  )
}
