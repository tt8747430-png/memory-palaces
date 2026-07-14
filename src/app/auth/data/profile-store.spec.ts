import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { InMemoryRepository } from '@app/shared/data'
import { PROFILE_REPOSITORY, ProfileStore } from './stores'
import { makeProfile } from '../model/profile'
import type { Profile } from '../model/profile'

const at = (ms: number) => new Date(ms).toISOString()

function setup(seed: Profile[] = []) {
  const repo = new InMemoryRepository<Profile>(seed)
  TestBed.configureTestingModule({ providers: [{ provide: PROFILE_REPOSITORY, useValue: repo }] })
  return { repo, store: TestBed.inject(ProfileStore) }
}

describe('profile store — Dependency Injection', () => {
  it('starts empty and becomes ready', () => {
    const { store } = setup()
    store.start()
    expect(store.profile()).toBeNull()
    expect(store.status()).toBe('ready')
  })

  it('reflects the seeded record through the injected repository', () => {
    const { store } = setup([makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada' })])
    store.start()
    expect(store.profile()?.name).toBe('Ada')
  })

  it('persists saves through the port and stays reactive', async () => {
    const { repo, store } = setup()
    store.start()

    const next = makeProfile({ id: 'profile', createdAt: at(0), name: 'Grace' })
    await store.save(next)

    expect(await repo.getById('profile')).toEqual(next)
    expect(store.profile()?.name).toBe('Grace')
  })
})
