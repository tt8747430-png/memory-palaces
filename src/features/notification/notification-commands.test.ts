import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type AppNotification, createNotificationStore } from '@/entities/notification'
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
    const n = await recordNotification(store, { type: 'level-up', level: 3 }, 1000)

    expect(n.id).toBeTruthy()
    expect(n.read).toBe(false)
    expect(n.createdAt).toBe(new Date(1000).toISOString())
    expect(store.getState().notifications).toHaveLength(1)
  })

  it('writes the milestone whole, numbers and kind together', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'quiz', accuracy: 90, xpGain: 60 }, 1000)

    expect(n.milestone).toEqual({ type: 'quiz', accuracy: 90, xpGain: 60 })
  })

  it('refuses a milestone nobody reached, and writes nothing', async () => {
    const store = startedStore()

    await expect(recordNotification(store, { type: 'streak', count: 0 }, 1000)).rejects.toThrow(
      /streak/i,
    )
    expect(store.getState().notifications).toEqual([])
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

  it('writes nothing when everything has already been seen', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await markAllNotificationsRead(store, 99)
    const before = store.getState().notifications

    await markAllNotificationsRead(store, 100)

    expect(store.getState().notifications).toEqual(before)
  })
})

describe('removeNotification / clearNotifications', () => {
  it('removes a single notification by id', async () => {
    const store = startedStore()
    const n = await recordNotification(store, { type: 'quiz', accuracy: 90, xpGain: 10 }, 1)

    await removeNotification(store, n.id)

    expect(store.getState().notifications).toHaveLength(0)
  })

  it('clears every notification at once', async () => {
    const store = startedStore()
    await recordNotification(store, { type: 'streak', count: 7 }, 1)
    await recordNotification(store, { type: 'streak', count: 14 }, 2)

    await clearNotifications(store)

    expect(store.getState().notifications).toEqual([])
  })
})
