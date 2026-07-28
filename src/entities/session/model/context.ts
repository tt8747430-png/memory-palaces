import { createStoreContext } from '@/shared/lib'
import type { SessionState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<SessionState>('Session')

export const SessionStoreContext = StoreContext
export const useSessionStore = useSelector
export const useSessionStoreApi = useStoreApi
