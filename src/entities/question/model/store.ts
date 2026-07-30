import type { StoreApi } from 'zustand/vanilla'
import { byOrderThenCreated, type CollectionState, createCollectionStore } from '@/shared/lib'
import type { QuestionRepository } from '@/entities/question'
import type { Question } from './types'

export type QuestionState = CollectionState<'questions', Question>
export type QuestionStore = StoreApi<QuestionState>

export function createQuestionStore(repo: QuestionRepository): QuestionStore {
  return createCollectionStore('questions', repo, byOrderThenCreated)
}
