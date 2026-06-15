import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createRoomStore } from './store'
import { makeRoom, type Room } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const room = (id: string, palaceId: string, order: number, title = id): Room =>
  makeRoom({ id, createdAt: at(0), palaceId, title, order })

describe('room store — reactive, Dependency Injection', () => {
  it('start() hydrates rooms from the injected repository and becomes ready', () => {
    const repo = new InMemoryRepository<Room>([room('r1', 'p1', 0)])
    const store = createRoomStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().rooms.map((r) => r.id)).toEqual(['r1'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<Room>()
    const store = createRoomStore(repo)
    store.getState().start()

    await store.getState().save(room('r1', 'p1', 0))
    expect(store.getState().rooms).toHaveLength(1)
    expect(await repo.getById('r1')).not.toBeNull()

    await store.getState().remove('r1')
    expect(store.getState().rooms).toHaveLength(0)
  })

  it('orders rooms by their order field ascending', async () => {
    const repo = new InMemoryRepository<Room>()
    const store = createRoomStore(repo)
    store.getState().start()

    await store.getState().save(room('b', 'p1', 1))
    await store.getState().save(room('a', 'p1', 0))

    expect(store.getState().rooms.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('is swappable: independent adapters yield independent state (Liskov)', () => {
    const seededStore = createRoomStore(new InMemoryRepository<Room>([room('seed', 'p1', 0)]))
    const emptyStore = createRoomStore(new InMemoryRepository<Room>())

    seededStore.getState().start()
    emptyStore.getState().start()

    expect(seededStore.getState().rooms.map((r) => r.id)).toEqual(['seed'])
    expect(emptyStore.getState().rooms).toEqual([])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const repo = new InMemoryRepository<Room>()
    const store = createRoomStore(repo)
    store.getState().start()
    store.getState().stop()

    await repo.save(room('r1', 'p1', 0))

    expect(store.getState().rooms).toEqual([])
  })
})
