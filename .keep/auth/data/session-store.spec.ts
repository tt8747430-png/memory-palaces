import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { InMemoryRepository } from '@app/shared/data'
import { SESSION_REPOSITORY, SessionStore } from './stores'
import { makeGuestSession } from '../model/session'
import type { Session } from '../model/session'

const at = (ms: number) => new Date(ms).toISOString()

function setup(seed: Session[] = []) {
  const repo = new InMemoryRepository<Session>(seed)
  TestBed.configureTestingModule({ providers: [{ provide: SESSION_REPOSITORY, useValue: repo }] })
  return { repo, store: TestBed.inject(SessionStore) }
}

describe('session store — Dependency Injection', () => {
  it('reads and writes through the injected repository', async () => {
    const { repo, store } = setup()

    await store.load()
    expect(store.session()).toBeNull()
    expect(store.status()).toBe('ready')

    const guest = makeGuestSession('g1', at(0))
    await store.set(guest)

    expect(store.session()).toEqual(guest)
    expect(await repo.getById('g1')).toEqual(guest)
  })

  it('loads a persisted session on start', async () => {
    const { store } = setup([makeGuestSession('seed', at(0))])

    await store.load()

    expect(store.session()?.id).toBe('seed')
  })

  it('clear() removes the active session from the repository', async () => {
    const { repo, store } = setup([makeGuestSession('g1', at(0))])
    await store.load()

    await store.clear()

    expect(store.session()).toBeNull()
    expect(await repo.getById('g1')).toBeNull()
  })
})
