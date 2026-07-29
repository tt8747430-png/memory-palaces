import {
  type AppNotification,
  makeNotification,
  type MakeNotificationInput,
  NOTIFICATION_CAP,
  type NotificationStore,
} from '@/entities/notification'
import { newId } from '@/shared/lib'

export type NotificationDraft = Omit<MakeNotificationInput, 'id' | 'createdAt' | 'read'>

export async function recordNotification(
  store: NotificationStore,
  draft: NotificationDraft,
  now: number = Date.now(),
): Promise<AppNotification> {
  const notification = makeNotification({
    ...draft,
    id: newId(),
    createdAt: new Date(now).toISOString(),
  })
  await store.getState().save(notification)
  await pruneToCapacity(store)
  return notification
}

async function pruneToCapacity(store: NotificationStore): Promise<void> {
  const overflow = store.getState().notifications.slice(NOTIFICATION_CAP)
  for (const stale of overflow) await store.getState().remove(stale.id)
}
