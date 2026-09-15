import { createStoreContext } from '@/shared/lib'
import type { PendingChangeState } from './store'

const { StoreContext, useSelector, useStoreApi } =
  createStoreContext<PendingChangeState>('PendingChange')

export const PendingChangeStoreContext = StoreContext
export const usePendingChangeStore = useSelector
export const usePendingChangeStoreApi = useStoreApi
