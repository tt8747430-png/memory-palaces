import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { withoutFields } from '@/shared/test/legacy-document'
import { createProfileStore } from './store'
import { makeProfile, type Profile } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('profile store — Dependency Injection', () => {
  it('starts empty and becomes ready', () => {
    const store = createProfileStore(new InMemoryRepository<Profile>())
    store.getState().start()
    expect(store.getState().profile).toBeNull()
    expect(store.getState().status).toBe('ready')
  })

  it('reflects the seeded record through the injected repository', () => {
    const seed = makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada' })
    const store = createProfileStore(new InMemoryRepository<Profile>([seed]))
    store.getState().start()
    expect(store.getState().profile?.name).toBe('Ada')
  })

  it('completes a document written before a field existed', () => {
    // What a device running an older build pushed, pulled back into this one: the schema migration
    // never sees it, because replication writes at the current version.
    const legacy = withoutFields(
      makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada' }),
      'phone',
    )
    const store = createProfileStore(new InMemoryRepository<Profile>([legacy]))
    store.getState().start()
    expect(store.getState().profile?.phone).toBe('')
    expect(store.getState().profile?.name).toBe('Ada')
  })

  it('persists saves through the port and stays reactive', async () => {
    const repo = new InMemoryRepository<Profile>()
    const store = createProfileStore(repo)
    store.getState().start()

    const next = makeProfile({ id: 'profile', createdAt: at(0), name: 'Grace' })
    await store.getState().save(next)

    expect(await repo.getById('profile')).toEqual(next)
    expect(store.getState().profile?.name).toBe('Grace')
  })
})
