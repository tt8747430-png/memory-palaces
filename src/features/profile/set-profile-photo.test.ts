import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createProfileStore, type Profile, type ProfileStore } from '@/entities/profile'
import { started } from '@/shared/test/started'
import { setProfilePhoto } from './set-profile-photo'

const NOW = 0
const DATA_URL = `data:image/jpeg;base64,${btoa('photo')}`

function setup() {
  const store: ProfileStore = started(createProfileStore(new InMemoryRepository<Profile>()))
  const storage = {
    upload: vi.fn().mockResolvedValue({ url: 'https://cdn/avatars/u1/profile' }),
    remove: vi.fn().mockResolvedValue(undefined),
  }
  return { store, storage }
}

describe('setProfilePhoto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves the local photo first, then patches in the hosted URL', async () => {
    const { store, storage } = setup()

    const profile = await setProfilePhoto({ store, storage, userId: 'u1' }, DATA_URL, NOW)

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'avatars', path: 'u1/profile', contentType: 'image/jpeg' }),
    )
    expect(profile.avatar).toBe('https://cdn/avatars/u1/profile')
    expect(store.getState().profile?.avatar).toBe('https://cdn/avatars/u1/profile')
  })

  it('keeps the local photo when the upload fails', async () => {
    const { store, storage } = setup()
    storage.upload.mockRejectedValue(new Error('offline'))

    const profile = await setProfilePhoto({ store, storage, userId: 'u1' }, DATA_URL, NOW)

    expect(profile.avatar).toBe(DATA_URL)
    expect(store.getState().profile?.avatar).toBe(DATA_URL)
  })

  it('never uploads a guest photo', async () => {
    const { store, storage } = setup()

    const profile = await setProfilePhoto({ store, storage, userId: null }, DATA_URL, NOW)

    expect(storage.upload).not.toHaveBeenCalled()
    expect(profile.avatar).toBe(DATA_URL)
  })

  it('leaves an already-hosted photo alone', async () => {
    const { store, storage } = setup()

    await setProfilePhoto({ store, storage, userId: 'u1' }, 'https://cdn/existing.jpg', NOW)

    expect(storage.upload).not.toHaveBeenCalled()
  })
})
