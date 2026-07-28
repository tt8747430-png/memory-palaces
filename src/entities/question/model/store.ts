import type { StoreApi } from 'zustand/vanilla'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import type { QuestionRepository } from '@/entities/question'
import type { Question } from './types'

export type QuestionState = CollectionState<'questions', Question>
export type QuestionStore = StoreApi<QuestionState>

const byOrder = (a: Question, b: Question): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export function createQuestionStore(repo: QuestionRepository): QuestionStore {
  return createCollectionStore('questions', repo, byOrder)
}
