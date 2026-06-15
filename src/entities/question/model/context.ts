import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { QuestionState, QuestionStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const QuestionStoreContext = createContext<QuestionStore | null>(null)

function useQuestionStoreContext(): QuestionStore {
  const store = useContext(QuestionStoreContext)
  if (!store) {
    throw new Error('Question store missing — render inside <QuestionStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of question state. */
export function useQuestionStore<T>(selector: (state: QuestionState) => T): T {
  return useStore(useQuestionStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useQuestionStoreApi(): QuestionStore {
  return useQuestionStoreContext()
}
