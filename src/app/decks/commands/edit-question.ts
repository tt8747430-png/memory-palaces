import { updateQuestion } from '@app/decks/model/question'
import type { Question, QuestionChanges } from '@app/decks/model/question'
import type { QuestionStore } from '@app/decks/data/stores'
import { requireQuestion } from './require-question'

export async function editQuestion(
  store: QuestionStore,
  id: string,
  changes: QuestionChanges,
): Promise<Question> {
  const existing = requireQuestion(store, id)
  const updated = updateQuestion(existing, changes, new Date().toISOString())
  await store.save(updated)
  return updated
}
