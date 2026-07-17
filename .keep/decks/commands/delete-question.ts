import type { QuestionStore } from '@app/decks/data/stores'

export async function deleteQuestion(store: QuestionStore, id: string): Promise<void> {
  await store.remove(id)
}
