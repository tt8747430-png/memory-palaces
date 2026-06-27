import {
  type AppNotification,
  makeNotification,
  type MakeNotificationInput,
  NOTIFICATION_CAP,
  type NotificationStore,
} from '@/entities/notification'

/** Everything {@link makeNotification} needs except the generated identity/timestamp
 * and the always-unread flag. */
export type NotificationDraft = Omit<MakeNotificationInput, 'id' | 'createdAt' | 'read'>

/**
 * Command — append a milestone to the history. Id + clock are generated here (the
 * side-effect layer); the new entry is unread. After persisting, the oldest entries
 * beyond {@link NOTIFICATION_CAP} are pruned so the log stays bounded.
 */
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
  await store.getState().save(notification)
  await pruneToCapacity(store)
  return notification
}

/** The store keeps the list newest-first, so everything past the cap is the oldest. */
async function pruneToCapacity(store: NotificationStore): Promise<void> {
  const overflow = store.getState().notifications.slice(NOTIFICATION_CAP)
  for (const stale of overflow) await store.getState().remove(stale.id)
}
