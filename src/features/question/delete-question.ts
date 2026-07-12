import type { QuestionStore } from '@/entities/question'

export async function deleteQuestion(store: QuestionStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
