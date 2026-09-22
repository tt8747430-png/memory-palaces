import type { NotificationStore } from '@/entities/notification'

export async function removeNotification(store: NotificationStore, id: string): Promise<void> {
  await store.getState().remove(id)
}

export async function clearNotifications(store: NotificationStore): Promise<void> {
  const { notifications, remove } = store.getState()
  await Promise.all(notifications.map((n) => remove(n.id)))
}
