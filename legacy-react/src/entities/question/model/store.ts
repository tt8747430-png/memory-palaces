import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { QuestionRepository } from '@/entities/question'
import type { Question } from './types'

export type QuestionStatus = 'idle' | 'loading' | 'ready'

export interface QuestionState {
  questions: Question[]
  status: QuestionStatus
  start: () => void
  stop: () => void
  save: (question: Question) => Promise<Question>
  remove: (id: string) => Promise<void>
}

export type QuestionStore = StoreApi<QuestionState>

const byOrder = (a: Question, b: Question): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export function createQuestionStore(repo: QuestionRepository): QuestionStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<QuestionState>((set) => ({
    questions: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((questions) => {
        set({ questions: [...questions].sort(byOrder), status: 'ready' })
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
