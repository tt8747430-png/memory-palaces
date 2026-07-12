import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { NotificationState, NotificationStore } from './store'

export const NotificationStoreContext = createContext<NotificationStore | null>(null)

function useNotificationStoreContext(): NotificationStore {
  const store = useContext(NotificationStoreContext)
  if (!store) {
    throw new Error(
      'Notification store missing — render inside <NotificationStoreContext value={…}>',
    )
  }
  return store
}

export function useNotificationStore<T>(selector: (state: NotificationState) => T): T {
  return useStore(useNotificationStoreContext(), selector)
}

export function useNotificationStoreApi(): NotificationStore {
  return useNotificationStoreContext()
}

export function useNotificationStoreApiOptional(): NotificationStore | null {
  return useContext(NotificationStoreContext)
}
