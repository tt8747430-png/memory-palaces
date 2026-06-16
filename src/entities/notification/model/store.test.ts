import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createNotificationStore } from './store'
import { selectUnreadCount } from './selectors'
import { makeNotification, type AppNotification } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const notif = (id: string, createdAt: string) =>
  makeNotification({ id, createdAt, type: 'level-up', level: 2 })

describe('notification store — reactive, Dependency Injection', () => {
  it('start() hydrates from the injected repository and becomes ready', () => {
    const repo = new InMemoryRepository<AppNotification>([notif('a', at(0))])
    const store = createNotificationStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().notifications.map((n) => n.id)).toEqual(['a'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<AppNotification>()
    const store = createNotificationStore(repo)
    store.getState().start()

    await store.getState().save(notif('a', at(0)))
    expect(store.getState().notifications).toHaveLength(1)
    expect(await repo.getById('a')).not.toBeNull()

    await store.getState().remove('a')
    expect(store.getState().notifications).toHaveLength(0)
  })

  it('orders notifications newest-first by createdAt', async () => {
    const repo = new InMemoryRepository<AppNotification>()
    const store = createNotificationStore(repo)
    store.getState().start()

    await store.getState().save(notif('old', at(0)))
    await store.getState().save(notif('new', at(1000)))

    expect(store.getState().notifications.map((n) => n.id)).toEqual(['new', 'old'])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const repo = new InMemoryRepository<AppNotification>()
    const store = createNotificationStore(repo)
    store.getState().start()
    store.getState().stop()

    await repo.save(notif('a', at(0)))

    expect(store.getState().notifications).toEqual([])
  })

  it('selectUnreadCount counts only unread notifications', async () => {
    const repo = new InMemoryRepository<AppNotification>()
    const store = createNotificationStore(repo)
    store.getState().start()

    await store.getState().save(makeNotification({ id: 'a', createdAt: at(0), type: 'streak', count: 7 }))
    await store
      .getState()
      .save(makeNotification({ id: 'b', createdAt: at(1), type: 'streak', count: 14, read: true }))

    expect(selectUnreadCount(store.getState())).toBe(1)
  })
})
