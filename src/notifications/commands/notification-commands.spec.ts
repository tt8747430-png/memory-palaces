import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import { NotificationStore } from '../data/notification-store'
import { NOTIFICATION_CAP } from '../model/notification'
import type { AppNotification } from '../model/notification'
import { recordNotification } from './record-notification'
import { markAllNotificationsRead } from './mark-all-read'
import { removeNotification, clearNotifications } from './remove-notification'

function startedStore(seed: AppNotification[] = []) {
  const store = new NotificationStore(new InMemoryRepository<AppNotification>(seed))
  store.start()
  return store
}

describe('recordNotification', () => {
  it('persists a new unread notification with a generated id + timestamp', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'level-up', level: 3, xpGain: 50 }, 1000)

    expect(n.id).toBeTruthy()
    expect(n.read).toBe(false)
    expect(n.createdAt).toBe(new Date(1000).toISOString())
    expect(store.notifications()).toHaveLength(1)
  })

  it('prunes the oldest entries beyond the cap', async () => {
    const store = startedStore()
    for (let i = 0; i <= NOTIFICATION_CAP; i++) {
      await recordNotification(store, { type: 'streak', count: i }, i + 1)
    }

    const counts = store.notifications().map((n) => n.count)
    expect(counts).toHaveLength(NOTIFICATION_CAP)
    expect(counts).not.toContain(0)
    expect(counts[0]).toBe(NOTIFICATION_CAP)
  })
})

describe('markAllNotificationsRead', () => {
  it('marks every unread notification read', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await recordNotification(store, { type: 'level-up', level: 2 }, 2)

    await markAllNotificationsRead(store, 99)

    expect(store.notifications().every((n) => n.read)).toBe(true)
  })
})

describe('removeNotification / clearNotifications', () => {
  it('removes a single notification by id', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'quiz', accuracy: 90 }, 1)

    await removeNotification(store, n.id)

    expect(store.notifications()).toHaveLength(0)
  })

  it('clears the whole history', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await recordNotification(store, { type: 'streak', count: 14 }, 2)

    await clearNotifications(store)

    expect(store.notifications()).toEqual([])
  })
})
