import type { ProgressStore } from '@/entities/progress'
import type { NotificationStore } from '@/entities/notification'
import { clearNotifications } from '@/features/notification'
import { clearAllContent, type ContentStores } from './clear-content'
import { resetProgress } from './reset-progress'

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
