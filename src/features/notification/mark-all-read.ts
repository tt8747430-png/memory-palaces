import type { NotificationStore } from '@/entities/notification'
import { nowIso } from '@/shared/lib'

export async function markAllNotificationsRead(
  store: NotificationStore,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = nowIso(now)
  const { notifications, save } = store.getState()
  const unread = notifications.filter((n) => !n.read)
  await Promise.all(unread.map((n) => save({ ...n, read: true, updatedAt })))
}
