import { createStoreContext } from '@/shared/lib'
import type { QuestionState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<QuestionState>('Question')

export const QuestionStoreContext = StoreContext
export const useQuestionStore = useSelector
export const useQuestionStoreApi = useStoreApi
