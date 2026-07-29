import {
  type Question,
  type QuestionChanges,
  type QuestionStore,
  updateQuestion,
} from '@/entities/question'
import { requireQuestion } from './require-question'
import { nowIso } from '@/shared/lib'

export async function editQuestion(
  store: QuestionStore,
  id: string,
  changes: QuestionChanges,
): Promise<Question> {
  const existing = requireQuestion(store, id)
  const updated = updateQuestion(existing, changes, nowIso())
  await store.getState().save(updated)
  return updated
}
