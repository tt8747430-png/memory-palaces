import type { QuestionStore } from '@/decks/data/stores'

/** Delete a selection of questions. */
export async function deleteQuestions(store: QuestionStore, ids: readonly string[]): Promise<void> {
  const targets = new Set(ids)
  await Promise.all([...targets].map((id) => store.remove(id)))
}
