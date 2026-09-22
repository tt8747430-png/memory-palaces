import type { AppNotification } from './types'
import type { NotificationState } from './store'

export const selectNotifications = (state: NotificationState): AppNotification[] =>
  state.notifications

export const selectUnreadCount = (state: NotificationState): number =>
  state.notifications.reduce((count, n) => (n.read ? count : count + 1), 0)

/** The ids waiting to be seen, for a screen that marks them read the moment it opens. */
export const selectUnreadIds = (state: NotificationState): string[] =>
  state.notifications.flatMap((n) => (n.read ? [] : [n.id]))
