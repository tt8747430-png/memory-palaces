import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import {
  createNotificationStore,
  NOTIFICATION_CAP,
  type AppNotification,
} from '@/entities/notification'
import {
  clearNotifications,
  markAllNotificationsRead,
  recordNotification,
  removeNotification,
} from './index'

function startedStore(seed: AppNotification[] = []) {
  const store = createNotificationStore(new InMemoryRepository<AppNotification>(seed))
  store.getState().start()
  return store
}

describe('recordNotification', () => {
  it('persists a new unread notification with a generated id + timestamp', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'level-up', level: 3, xpGain: 50 }, 1000)

    expect(n.id).toBeTruthy()
    expect(n.read).toBe(false)
    expect(n.createdAt).toBe(new Date(1000).toISOString())
    expect(store.getState().notifications).toHaveLength(1)
  })

  it('prunes the oldest entries beyond the cap', async () => {
    const store = startedStore()
    for (let i = 0; i <= NOTIFICATION_CAP; i++) {
      await recordNotification(store, { type: 'streak', count: i }, i + 1)
    }

    const counts = store.getState().notifications.map((n) => n.count)
    expect(counts).toHaveLength(NOTIFICATION_CAP)
    expect(counts).not.toContain(0) // the very first one is pruned
    expect(counts[0]).toBe(NOTIFICATION_CAP) // newest-first
  })
})

describe('markAllNotificationsRead', () => {
  it('marks every unread notification read', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await recordNotification(store, { type: 'level-up', level: 2 }, 2)

    await markAllNotificationsRead(store, 99)

    expect(store.getState().notifications.every((n) => n.read)).toBe(true)
  })
})

describe('removeNotification / clearNotifications', () => {
  it('removes a single notification by id', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'quiz', accuracy: 90 }, 1)

    await removeNotification(store, n.id)

    expect(store.getState().notifications).toHaveLength(0)
  })

  it('clears the whole history', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await recordNotification(store, { type: 'streak', count: 14 }, 2)

    await clearNotifications(store)

    expect(store.getState().notifications).toEqual([])
  })
})
