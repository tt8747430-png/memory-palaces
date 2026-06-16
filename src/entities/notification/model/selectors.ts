import type { AppNotification } from './types'
import type { NotificationState } from './store'

/** Read surface for notification state. Each returns a stable reference/primitive so
 * `useNotificationStore(selector)` re-renders only when the selected value changes. */
export const selectNotifications = (state: NotificationState): AppNotification[] =>
  state.notifications
export const selectUnreadCount = (state: NotificationState): number =>
  state.notifications.reduce((count, n) => (n.read ? count : count + 1), 0)
export const selectIsReady = (state: NotificationState): boolean => state.status === 'ready'
