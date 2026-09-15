import { createStoreContext } from '@/shared/lib'
import type { SyncStateState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<SyncStateState>('SyncState')

export const SyncStateStoreContext = StoreContext
export const useSyncStateStore = useSelector
export const useSyncStateStoreApi = useStoreApi
