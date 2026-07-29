import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createSessionStore } from './store'
import { makeGuestSession, type Session } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('session store — Dependency Injection', () => {
  it('reads and writes through the injected repository', async () => {
    const repo = new InMemoryRepository<Session>()
    const store = createSessionStore(repo)

    expect(store.getState().session).toBeNull()
    expect(store.getState().status).toBe('idle')

    const guest = makeGuestSession('g1', at(0))
    await store.getState().set(guest)

    expect(store.getState().session).toEqual(guest)
    expect(store.getState().status).toBe('ready')
    expect(await repo.getById('g1')).toEqual(guest)
  })

  it('is swappable: a different adapter yields independent state (Liskov)', async () => {
    const storeA = createSessionStore(new InMemoryRepository<Session>())
    const storeB = createSessionStore(new InMemoryRepository<Session>())

    await storeA.getState().set(makeGuestSession('a', at(0)))

    expect(storeA.getState().session?.id).toBe('a')
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
