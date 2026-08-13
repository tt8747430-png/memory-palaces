import 'fake-indexeddb/auto'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { describe, expect, it } from 'vitest'
import { RxdbRepository } from '@/shared/api/rxdb'
import { makeProfile, type Profile } from '@/entities/profile'
import { cardMigrations, createAppDatabase, deckMigrations } from './database'
import { cardSchema, deckSchema } from './schemas'

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

describe('schema migrations', () => {
  it('leaves a v0 deck untouched — absent settings resolve to defaults at read time', () => {
    const v0 = { id: 'd1', name: 'Deck', settings: { shuffleCards: true } }
    expect(deckMigrations[1](v0 as never)).toEqual(v0)
  })

  it('gives a v0 card the learner flags it never had', () => {
    const v0 = { id: 'c1', deckId: 'd1', front: 'f', back: 'b', flagged: false, memorized: false }
    const migrated = cardMigrations[1](v0 as never)
    expect(migrated.frozen).toBe(false)
    expect(migrated.reversed).toBe(false)
    expect(migrated.fastReview).toBeUndefined()
  })

  it('versions both collections', () => {
    expect(deckSchema.version).toBe(1)
    expect(cardSchema.version).toBe(1)
  })
})
