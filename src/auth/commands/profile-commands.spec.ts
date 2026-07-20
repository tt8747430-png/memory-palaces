import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import type { Profile } from '@/auth/model/profile'
import { setProfile } from './profile-index'
import { ProfileStore } from '@/auth/data/stores'

const NOW = Date.UTC(2026, 0, 10)

function startedStore(seed: Profile[] = []) {
  const store = new ProfileStore(new InMemoryRepository<Profile>(seed))
  store.start()
  return store
}

describe('setProfile', () => {
  it('creates the singleton and applies a change, keeping other defaults', async () => {
    const store = startedStore()
    const profile = await setProfile(store, { name: 'Ada Lovelace' }, NOW)
    expect(profile.name).toBe('Ada Lovelace')
    expect(profile.email).toBe('')
    expect(profile.avatar).toBeNull()
    expect(store.profile()?.name).toBe('Ada Lovelace')
  })

  it('merges successive changes into the one record', async () => {
    const store = startedStore()
    await setProfile(store, { name: 'Ada' }, NOW)
    const profile = await setProfile(store, { email: 'ada@example.com' }, NOW)
    expect(profile.name).toBe('Ada')
    expect(profile.email).toBe('ada@example.com')
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = startedStore()
    const profile = await setProfile(store, { bio: 'Mathematician' }, NOW)
    expect(profile.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('clears the avatar when set to null', async () => {
    const store = startedStore()
    await setProfile(store, { avatar: 'data:image/jpeg;base64,xxx' }, NOW)
    const profile = await setProfile(store, { avatar: null }, NOW)
    expect(profile.avatar).toBeNull()
  })
})
