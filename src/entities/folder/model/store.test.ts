import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createFolderStore } from './store'
import { makeFolder, type Folder } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const folder = (id: string, createdAt: string, name = id): Folder =>
  makeFolder({ id, createdAt, name, color: 'from-sky-500 to-blue-600', icon: '📁' })

describe('folder store — reactive, Dependency Injection', () => {
  it('start() hydrates folders from the injected repository and becomes ready', () => {
    const repo = new InMemoryRepository<Folder>([folder('a', at(0), 'Languages')])
    const store = createFolderStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().folders.map((f) => f.id)).toEqual(['a'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<Folder>()
    const store = createFolderStore(repo)
    store.getState().start()

    await store.getState().save(folder('a', at(0)))
    expect(store.getState().folders).toHaveLength(1)
    expect(await repo.getById('a')).not.toBeNull()

    await store.getState().remove('a')
    expect(store.getState().folders).toHaveLength(0)
  })

  it('orders folders oldest-first by createdAt (stable rail order)', async () => {
    const repo = new InMemoryRepository<Folder>()
    const store = createFolderStore(repo)
    store.getState().start()

    await store.getState().save(folder('new', at(1000)))
    await store.getState().save(folder('old', at(0)))

    expect(store.getState().folders.map((f) => f.id)).toEqual(['old', 'new'])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const repo = new InMemoryRepository<Folder>()
    const store = createFolderStore(repo)
    store.getState().start()
    store.getState().stop()

    await repo.save(folder('a', at(0)))

    expect(store.getState().folders).toEqual([])
  })
})
