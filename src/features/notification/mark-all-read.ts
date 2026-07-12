import type { NotificationStore } from '@/entities/notification'

export async function markAllNotificationsRead(
  store: NotificationStore,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = new Date(now).toISOString()
  const unread = store.getState().notifications.filter((n) => !n.read)
  for (const notification of unread) {
    await store.getState().save({ ...notification, read: true, updatedAt })
  }
}
