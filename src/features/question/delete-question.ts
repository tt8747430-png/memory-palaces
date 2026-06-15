import type { QuestionStore } from '@/entities/question'

/** Command — delete a question. Idempotent (removing a missing question is a no-op). */
export async function deleteQuestion(store: QuestionStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
