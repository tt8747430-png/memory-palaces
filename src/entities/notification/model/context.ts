import { createStoreContext } from '@/shared/lib'
import type { NotificationState } from './store'

const { StoreContext, useSelector, useStoreApi, useStoreApiOptional } =
  createStoreContext<NotificationState>('Notification')

export const NotificationStoreContext = StoreContext
export const useNotificationStore = useSelector
export const useNotificationStoreApi = useStoreApi
export const useNotificationStoreApiOptional = useStoreApiOptional
