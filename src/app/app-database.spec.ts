import 'fake-indexeddb/auto'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { describe, expect, it } from 'vitest'
import { RxdbRepository } from '@app/shared/data/rxdb-repository'
import { makeProfile } from '@app/auth'
import type { Profile } from '@app/auth'
import { createAppDatabase } from './app-database'

describe('createAppDatabase', () => {
  it('registers a profiles collection that round-trips a Profile through RxDB', async () => {
    const collections = await createAppDatabase(getRxStorageDexie())
    const profiles = new RxdbRepository<Profile>(collections.profiles)

    const saved = makeProfile({
      id: 'profile',
      createdAt: new Date(0).toISOString(),
      name: 'Ada Lovelace',
      avatar: null,
    })
    await profiles.save(saved)

    expect(await profiles.getById('profile')).toEqual(saved)

    await collections.profiles.database.remove()
  })
})
