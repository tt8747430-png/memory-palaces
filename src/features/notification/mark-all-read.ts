import type { NotificationStore } from '@/entities/notification'
import { nowIso } from '@/shared/lib'

export async function markAllNotificationsRead(
  store: NotificationStore,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = nowIso(now)
  const unread = store.getState().notifications.filter((n) => !n.read)
  for (const notification of unread) {
    await store.getState().save({ ...notification, read: true, updatedAt })
  }
}
