import {
  type AppNotification,
  makeNotification,
  type Milestone,
  type NotificationStore,
} from '@/entities/notification'
import { newId, nowIso } from '@/shared/lib'

/**
 * Writes the milestone down. Nothing here trims the list: a cap has to see every notification at
 * once, so `keepCapped` in the composition root owns it.
 */
export async function recordNotification(
  store: NotificationStore,
  milestone: Milestone,
  now: number = Date.now(),
): Promise<AppNotification> {
  const notification = makeNotification({ id: newId(), createdAt: nowIso(now), milestone })
  await store.getState().save(notification)
  return notification
}
