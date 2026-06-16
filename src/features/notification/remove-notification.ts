import type { NotificationStore } from '@/entities/notification'

/** Command — drop a single notification from the history. */
export async function removeNotification(store: NotificationStore, id: string): Promise<void> {
  await store.getState().remove(id)
}

/** Command — empty the entire history. */
export async function clearNotifications(store: NotificationStore): Promise<void> {
  const ids = store.getState().notifications.map((n) => n.id)
  for (const id of ids) await store.getState().remove(id)
}
