import { createStoreContext } from '@/shared/lib'
import type { HistoryState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<HistoryState>('History')

export const HistoryStoreContext = StoreContext
export const useHistoryStore = useSelector
export const useHistoryStoreApi = useStoreApi
