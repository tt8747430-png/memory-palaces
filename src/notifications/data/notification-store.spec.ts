import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import { NotificationStore } from './notification-store'
import { makeNotification } from '../model/notification'
import type { AppNotification } from '../model/notification'

const at = (ms: number) => new Date(ms).toISOString()
const notif = (id: string, createdAt: string) =>
  makeNotification({ id, createdAt, type: 'level-up', level: 2 })

function setup(seed: AppNotification[] = []) {
  const repo = new InMemoryRepository<AppNotification>(seed)
  return { repo, store: new NotificationStore(repo) }
}

describe('notification store — reactive, Dependency Injection', () => {
  it('start() hydrates from the injected repository and becomes ready', () => {
    const { store } = setup([notif('a', at(0))])
    expect(store.status()).toBe('idle')

    store.start()

    expect(store.status()).toBe('ready')
    expect(store.notifications().map((n) => n.id)).toEqual(['a'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const { repo, store } = setup()
    store.start()

    await store.save(notif('a', at(0)))
    expect(store.notifications()).toHaveLength(1)
    expect(await repo.getById('a')).not.toBeNull()

    await store.remove('a')
    expect(store.notifications()).toHaveLength(0)
  })

  it('orders notifications newest-first by createdAt', async () => {
    const { store } = setup()
    store.start()

    await store.save(notif('old', at(0)))
    await store.save(notif('new', at(1000)))

    expect(store.notifications().map((n) => n.id)).toEqual(['new', 'old'])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const { repo, store } = setup()
    store.start()
    store.stop()

    await repo.save(notif('a', at(0)))

    expect(store.notifications()).toEqual([])
  })

  it('unreadCount counts only unread notifications', async () => {
    const { store } = setup()
    store.start()

    await store.save(makeNotification({ id: 'a', createdAt: at(0), type: 'streak', count: 7 }))
    await store.save(
      makeNotification({ id: 'b', createdAt: at(1), type: 'streak', count: 14, read: true }),
    )

    expect(store.unreadCount()).toBe(1)
  })
})
