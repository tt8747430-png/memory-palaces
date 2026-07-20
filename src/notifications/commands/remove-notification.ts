import type { NotificationStore } from '../data/notification-store'

export async function removeNotification(store: NotificationStore, id: string): Promise<void> {
  await store.remove(id)
}

export async function clearNotifications(store: NotificationStore): Promise<void> {
  const ids = store.notifications().map((n) => n.id)
  for (const id of ids) await store.remove(id)
}
