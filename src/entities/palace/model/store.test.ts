import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore } from './store'
import { makePalace, type Palace } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const palace = (id: string, createdAt: string, name = id) => makePalace({ id, createdAt, name })

describe('palace store — reactive, Dependency Injection', () => {
  it('start() hydrates palaces from the injected repository and becomes ready', () => {
    const repo = new InMemoryRepository<Palace>([palace('a', at(0), 'Alpha')])
    const store = createPalaceStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().palaces.map((p) => p.id)).toEqual(['a'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<Palace>()
    const store = createPalaceStore(repo)
    store.getState().start()

    await store.getState().save(palace('a', at(0)))
    expect(store.getState().palaces).toHaveLength(1)
    expect(await repo.getById('a')).not.toBeNull()

    await store.getState().remove('a')
    expect(store.getState().palaces).toHaveLength(0)
  })

  it('orders palaces newest-first by createdAt', async () => {
    const repo = new InMemoryRepository<Palace>()
    const store = createPalaceStore(repo)
    store.getState().start()

    await store.getState().save(palace('old', at(0)))
    await store.getState().save(palace('new', at(1000)))

    expect(store.getState().palaces.map((p) => p.id)).toEqual(['new', 'old'])
  })

  it('is swappable: independent adapters yield independent state (Liskov)', () => {
    const seededStore = createPalaceStore(new InMemoryRepository<Palace>([palace('seed', at(0))]))
    const emptyStore = createPalaceStore(new InMemoryRepository<Palace>())

    seededStore.getState().start()
    emptyStore.getState().start()

    expect(seededStore.getState().palaces.map((p) => p.id)).toEqual(['seed'])
    expect(emptyStore.getState().palaces).toEqual([])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const repo = new InMemoryRepository<Palace>()
    const store = createPalaceStore(repo)
    store.getState().start()
    store.getState().stop()

    await repo.save(palace('a', at(0)))

    expect(store.getState().palaces).toEqual([])
  })
})
