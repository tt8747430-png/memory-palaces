import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import { FolderStore } from './stores'
import { makeFolder } from '../model/folder'
import type { Folder } from '../model/folder'

const at = (ms: number) => new Date(ms).toISOString()
const folder = (id: string, createdAt: string, name = id): Folder =>
  makeFolder({ id, createdAt, name, color: 'from-sky-500 to-blue-600', icon: '📁' })

function setup(seed: Folder[] = []) {
  const repo = new InMemoryRepository<Folder>(seed)
  return { repo, store: new FolderStore(repo) }
}

describe('folder store — reactive, Dependency Injection', () => {
  it('start() hydrates folders from the injected repository and becomes ready', () => {
    const { store } = setup([folder('a', at(0), 'Languages')])
    expect(store.status()).toBe('idle')

    store.start()

    expect(store.status()).toBe('ready')
    expect(store.folders().map((f) => f.id)).toEqual(['a'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const { repo, store } = setup()
    store.start()

    await store.save(folder('a', at(0)))
    expect(store.folders()).toHaveLength(1)
    expect(await repo.getById('a')).not.toBeNull()

    await store.remove('a')
    expect(store.folders()).toHaveLength(0)
  })

  it('orders folders oldest-first by createdAt (stable rail order)', async () => {
    const { store } = setup()
    store.start()

    await store.save(folder('new', at(1000)))
    await store.save(folder('old', at(0)))

    expect(store.folders().map((f) => f.id)).toEqual(['old', 'new'])
  })

  it('stop() ends reactivity — later repository changes no longer reach the store', async () => {
    const { repo, store } = setup()
    store.start()
    store.stop()

    await repo.save(folder('a', at(0)))

    expect(store.folders()).toEqual([])
  })
})
