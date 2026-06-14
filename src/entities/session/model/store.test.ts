import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createSessionStore } from './store'
import { makeGuestSession, type Session } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('session store — Dependency Injection', () => {
  it('reads and writes through the injected repository', async () => {
    const repo = new InMemoryRepository<Session>()
    const store = createSessionStore(repo)

    await store.getState().load()
    expect(store.getState().session).toBeNull()
    expect(store.getState().status).toBe('ready')

    const guest = makeGuestSession('g1', at(0))
    await store.getState().set(guest)

    expect(store.getState().session).toEqual(guest)
    // persisted through the port, not just held in memory by the store
    expect(await repo.getById('g1')).toEqual(guest)
  })

  it('is swappable: a different adapter yields independent state (Liskov)', async () => {
    const seeded = new InMemoryRepository<Session>([makeGuestSession('seed', at(0))])
    const empty = new InMemoryRepository<Session>()

    const storeA = createSessionStore(seeded)
    const storeB = createSessionStore(empty)
    await storeA.getState().load()
    await storeB.getState().load()

    expect(storeA.getState().session?.id).toBe('seed')
    expect(storeB.getState().session).toBeNull()
  })

  it('clear() removes the current session from the repository', async () => {
    const repo = new InMemoryRepository<Session>()
    const store = createSessionStore(repo)
    await store.getState().set(makeGuestSession('g2', at(0)))

    await store.getState().clear()

    expect(store.getState().session).toBeNull()
    expect(await repo.getById('g2')).toBeNull()
  })
})
