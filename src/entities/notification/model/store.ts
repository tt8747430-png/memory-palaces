import type { StoreApi } from 'zustand/vanilla'
import { byNewestFirst, type CollectionState, createCollectionStore } from '@/shared/lib'
import type { NotificationRepository } from '@/entities/notification'
import type { AppNotification } from './types'

export type NotificationState = CollectionState<'notifications', AppNotification>
export type NotificationStore = StoreApi<NotificationState>

export function createNotificationStore(repo: NotificationRepository): NotificationStore {
  return createCollectionStore('notifications', repo, byNewestFirst)
}
