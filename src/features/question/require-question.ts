import { requireEntity } from '@/shared/lib'
import type { Question, QuestionStore } from '@/entities/question'

export function requireQuestion(store: QuestionStore, id: string): Question {
  return requireEntity(store.getState().questions, id, 'Question')
}
