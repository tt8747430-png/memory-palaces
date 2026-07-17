import type { NotificationStore } from '@app/notifications'

export async function clearNotifications(store: NotificationStore): Promise<void> {
  for (const notification of store.notifications()) {
    await store.remove(notification.id)
  }
}
