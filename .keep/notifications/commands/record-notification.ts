import { makeNotification, NOTIFICATION_CAP } from '../model/notification'
import type { AppNotification, MakeNotificationInput } from '../model/notification'
import type { NotificationStore } from '../data/notification-store'

export type NotificationDraft = Omit<MakeNotificationInput, 'id' | 'createdAt' | 'read'>

export async function recordNotification(
  store: NotificationStore,
  draft: NotificationDraft,
  now: number = Date.now(),
): Promise<AppNotification> {
  const notification = makeNotification({
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date(now).toISOString(),
  })
  await store.save(notification)
  await pruneToCapacity(store)
  return notification
}

async function pruneToCapacity(store: NotificationStore): Promise<void> {
  const overflow = store.notifications().slice(NOTIFICATION_CAP)
  for (const stale of overflow) await store.remove(stale.id)
}
