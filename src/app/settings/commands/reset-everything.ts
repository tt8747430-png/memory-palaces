import type { ProgressStore } from '@app/study/data/progress-store'
import type { NotificationStore } from '@app/notifications/data/notification-store'
import { clearAllContent, type ContentStores } from './clear-content'
import { resetProgress } from './reset-progress'
import { clearNotifications } from './clear-notifications'

export interface ResetEverythingStores extends ContentStores {
  progressStore: ProgressStore
  notificationStore: NotificationStore
}

export async function resetEverything(
  stores: ResetEverythingStores,
  now: number = Date.now(),
): Promise<void> {
  await clearAllContent(stores)
  await resetProgress(stores.progressStore, now)
  await clearNotifications(stores.notificationStore)
}
