import type { NotificationStore } from '../data/notification-store'

export async function markAllNotificationsRead(
  store: NotificationStore,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = new Date(now).toISOString()
  const unread = store.notifications().filter((n) => !n.read)
  for (const notification of unread) {
    await store.save({ ...notification, read: true, updatedAt })
  }
}
