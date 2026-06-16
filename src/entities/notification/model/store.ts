import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { NotificationRepository } from '../api/notification-repository'
import type { AppNotification } from './types'

export type NotificationStatus = 'idle' | 'loading' | 'ready'

export interface NotificationState {
  notifications: AppNotification[]
  status: NotificationStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps the list live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (notification: AppNotification) => Promise<AppNotification>
  remove: (id: string) => Promise<void>
}

export type NotificationStore = StoreApi<NotificationState>

const byNewestFirst = (a: AppNotification, b: AppNotification): number =>
  b.createdAt.localeCompare(a.createdAt)

/** Store FACTORY (repository INJECTED — Dependency Inversion). RxDB-reactive list,
 * mirroring the palace store; mutations persist through the port and the subscription
 * updates state. */
export function createNotificationStore(repo: NotificationRepository): NotificationStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<NotificationState>((set) => ({
    notifications: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((all) => {
        set({ notifications: [...all].sort(byNewestFirst), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(notification) {
      return repo.save(notification)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
