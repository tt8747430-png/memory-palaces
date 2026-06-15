import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { QuestionRepository } from '../api/question-repository'
import type { Question } from './types'

export type QuestionStatus = 'idle' | 'loading' | 'ready'

export interface QuestionState {
  questions: Question[]
  status: QuestionStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `questions` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (question: Question) => Promise<Question>
  remove: (id: string) => Promise<void>
}

export type QuestionStore = StoreApi<QuestionState>

const byOldestFirst = (a: Question, b: Question): number => a.createdAt.localeCompare(b.createdAt)

/** Store FACTORY (repository INJECTED), reactive like the other entity stores. */
export function createQuestionStore(repo: QuestionRepository): QuestionStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<QuestionState>((set) => ({
    questions: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((questions) => {
        set({ questions: [...questions].sort(byOldestFirst), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(question) {
      return repo.save(question)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
