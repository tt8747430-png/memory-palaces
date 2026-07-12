import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { QuestionState, QuestionStore } from './store'

export const QuestionStoreContext = createContext<QuestionStore | null>(null)

function useQuestionStoreContext(): QuestionStore {
  const store = useContext(QuestionStoreContext)
  if (!store) {
    throw new Error('Question store missing — render inside <QuestionStoreContext value={…}>')
  }
  return store
}

export function useQuestionStore<T>(selector: (state: QuestionState) => T): T {
  return useStore(useQuestionStoreContext(), selector)
}

export function useQuestionStoreApi(): QuestionStore {
  return useQuestionStoreContext()
}
