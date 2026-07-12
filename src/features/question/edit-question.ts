import { type Question, type QuestionChanges, type QuestionStore, updateQuestion, } from '@/entities/question'
import { requireQuestion } from './require-question'

export async function editQuestion(
  store: QuestionStore,
  id: string,
  changes: QuestionChanges,
): Promise<Question> {
  const existing = requireQuestion(store, id)
  const updated = updateQuestion(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
