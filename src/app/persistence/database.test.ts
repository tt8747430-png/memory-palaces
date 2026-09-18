import 'fake-indexeddb/auto'
import { createRxDatabase, type RxCollection, type RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { describe, expect, it } from 'vitest'
import { RxdbRepository } from '@/shared/api/rxdb'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { makeProfile, type Profile } from '@/entities/profile'
import type { PendingChange } from '@/entities/pending-change'
import { DEFAULT_SYNC_STATE, SYNC_STATE_ID } from '@/entities/sync-state'
import {
  type AppCollections,
  cardMigrations,
  createAppDatabase,
  deckMigrations,
  preferencesMigrations,
  profileMigrations,
} from './database'
import {
  cardSchema,
  deckSchema,
  pendingChangeSchema,
  preferencesSchema,
  profileSchema,
  syncStateSchema,
} from './schemas'

const AT = '2026-09-15T16:07:00.000Z'

async function reopenedAfterSeeding(
  name: string,
  schema: RxJsonSchema<Record<string, unknown>>,
  seed: (collection: RxCollection) => Promise<void>,
): Promise<AppCollections> {
  const storage = getRxStorageDexie()
  const before = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const created = await before.addCollections({ [name]: { schema } })
  const collection = created[name]
  if (!collection) throw new Error(`${name} did not open`)
  await seed(collection)
  await before.close()
  return createAppDatabase(storage)
}

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

  it('carries a v1 deck across the widened card-style enum untouched', () => {
    const v1 = {
      id: 'd1',
      name: 'Deck',
      settings: { cardStyle: { preset: 'paper', font: 'serif', textSize: 24, alignment: 'left' } },
    }
    expect(deckMigrations[2](v1 as never)).toEqual(v1)
  })

  it('repaints a v2 deck off the retired preset and keeps the rest of its style', () => {
    const v2 = {
      id: 'd1',
      name: 'Deck',
      settings: {
        shuffleCards: true,
        cardStyle: { preset: 'outlined', font: 'serif', textSize: 24, alignment: 'left' },
      },
    }
    expect(deckMigrations[3](v2 as never)).toEqual({
      id: 'd1',
      name: 'Deck',
      settings: {
        shuffleCards: true,
        cardStyle: { preset: 'plain', font: 'serif', textSize: 24, alignment: 'left' },
      },
    })
  })

  it('leaves a v2 deck on a surviving preset alone, and one with no style at all', () => {
    const kept = {
      id: 'd1',
      name: 'Deck',
      settings: { cardStyle: { preset: 'paper', font: 'serif', textSize: 24, alignment: 'left' } },
    }
    expect(deckMigrations[3](kept as never)).toEqual(kept)

    const styleless = { id: 'd2', name: 'Deck', settings: { shuffleCards: true } }
    expect(deckMigrations[3](styleless as never)).toEqual(styleless)
  })

  it('gives a v1 preferences document the recall toggle it predates', () => {
    const v1 = { id: 'preferences', studyMode: 'type', studyWordSpaces: true }
    expect(preferencesMigrations[2](v1 as never).studyTypeInitialsOnly).toBe(false)
  })

  it('leaves a preferences document that already stated the toggle alone', () => {
    const v1 = { id: 'preferences', studyTypeInitialsOnly: true }
    expect(preferencesMigrations[2](v1 as never).studyTypeInitialsOnly).toBe(true)
  })

  it('gives a v2 preferences document an empty extension list', () => {
    const stamp = new Date(0).toISOString()
    const v2 = { id: 'preferences', createdAt: stamp, updatedAt: stamp } as never
    expect(preferencesMigrations[3](v2).extensions).toEqual([])
  })

  it('leaves a list that is somehow already there alone', () => {
    const v2 = { id: 'preferences', extensions: ['bible'] } as never
    expect(preferencesMigrations[3](v2).extensions).toEqual(['bible'])
  })

  it('narrows a v3 deck cover from a public URL to its object path', () => {
    const v3 = {
      id: 'd1',
      name: 'Deck',
      image: 'https://abc.supabase.co/storage/v1/object/public/deck-images/u1/d1',
    }
    expect(deckMigrations[4](v3 as never).image).toBe('u1/d1')
  })

  it('leaves an inline cover and a coverless deck alone', () => {
    const inline = { id: 'd1', name: 'Deck', image: `data:image/jpeg;base64,${btoa('x')}` }
    expect(deckMigrations[4](inline as never)).toBe(inline)

    const none = { id: 'd2', name: 'Deck' }
    expect(deckMigrations[4](none as never)).toBe(none)
  })

  it('preserves an unrecognised cover value rather than discarding it', () => {
    const odd = { id: 'd1', name: 'Deck', image: 'https://elsewhere.example/x.jpg' }
    expect(deckMigrations[4](odd as never)).toBe(odd)
  })

  it('narrows a v1 avatar from a public URL to its object path', () => {
    const v1 = {
      id: 'profile',
      avatar: 'https://abc.supabase.co/storage/v1/object/public/avatars/u1/profile',
    }
    expect(profileMigrations[2](v1 as never).avatar).toBe('u1/profile')
  })

  it('versions the collections', () => {
    expect(deckSchema.version).toBe(4)
    expect(cardSchema.version).toBe(1)
    expect(preferencesSchema.version).toBe(3)
    expect(profileSchema.version).toBe(2)
    expect(pendingChangeSchema.version).toBe(1)
    expect(syncStateSchema.version).toBe(1)
  })

  it('turns Autosync on for a device that stored it off', async () => {
    const collections = await reopenedAfterSeeding(
      'syncState',
      { ...syncStateSchema, version: 0 } as unknown as RxJsonSchema<Record<string, unknown>>,
      async (syncState) => {
        await syncState.upsert({ ...DEFAULT_SYNC_STATE, autosync: false, lastSyncedAt: AT })
      },
    )
    const stored = await collections.syncState.findOne(SYNC_STATE_ID).exec()

    expect(stored?.get('autosync')).toBe(true)
    expect(stored?.get('lastSyncedAt')).toBe(AT)

    await collections.syncState.database.remove()
  })

  interface PendingChangeV0 {
    id: string
    collection: PendingChange['contentCollection']
    entityId: string
    op: PendingChange['op']
    at: string
  }

  const v0PendingChangeSchema: RxJsonSchema<PendingChangeV0> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 140 },
      collection: { type: 'string', enum: ['folders', 'decks', 'cards', 'questions'] },
      entityId: { type: 'string', maxLength: 100 },
      op: { type: 'string', enum: ['save', 'remove'] },
      at: { type: 'string' },
    },
    required: ['id', 'collection', 'entityId', 'op', 'at'],
    indexes: ['collection'],
  }

  it('carries a pending change written under the old field name across the rename', async () => {
    const row = { id: 'cards:c1', collection: 'cards', entityId: 'c1', op: 'save', at: AT }

    const collections = await reopenedAfterSeeding(
      'pendingChanges',
      v0PendingChangeSchema as unknown as RxJsonSchema<Record<string, unknown>>,
      async (pendingChanges) => {
        await expect(pendingChanges.upsert(row)).rejects.toThrow(/collection/)
        expect(await pendingChanges.storageInstance.findDocumentsById([row.id], true)).toHaveLength(
          1,
        )
      },
    )
    const migrated = await collections.pendingChanges.find().exec()

    expect(migrated.map((document) => document.toMutableJSON() as PendingChange)).toEqual([
      { id: 'cards:c1', contentCollection: 'cards', entityId: 'c1', op: 'save', at: AT },
    ])

    await collections.pendingChanges.database.remove()
  })
})
