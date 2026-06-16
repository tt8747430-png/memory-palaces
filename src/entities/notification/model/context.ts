import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { NotificationState, NotificationStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
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

/** Reactive, selector-scoped read of notification state. */
export function useNotificationStore<T>(selector: (state: NotificationState) => T): T {
  return useStore(useNotificationStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useNotificationStoreApi(): NotificationStore {
  return useNotificationStoreContext()
}

/** Imperative handle, or null when no store is provided. Lets the unread badge and
 * bridge degrade gracefully in contexts that don't mount notifications. */
export function useNotificationStoreApiOptional(): NotificationStore | null {
  return useContext(NotificationStoreContext)
}
