import type { NotificationStore } from '@/entities/notification'

/** Command — clear the entire notifications history. */
export async function clearNotifications(store: NotificationStore): Promise<void> {
  for (const notification of store.getState().notifications) {
    await store.getState().remove(notification.id)
  }
}
