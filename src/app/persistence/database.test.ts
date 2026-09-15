import 'fake-indexeddb/auto'
import { createRxDatabase, type RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { describe, expect, it } from 'vitest'
import { RxdbRepository } from '@/shared/api/rxdb'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { makeProfile, type Profile } from '@/entities/profile'
import type { PendingChange } from '@/entities/pending-change'
import {
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
} from './schemas'

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

  /**
   * The first deck migration that rewrites anything. `outlined` left the enum with v3, so a deck
   * still naming it would fail the schema and `validateDeckSettings` alike — it is repainted with
   * the preset it was a stroked variant of, and the learner's font, size and alignment are kept.
   */
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
    expect(preferencesSchema.version).toBe(2)
    expect(profileSchema.version).toBe(2)
    expect(pendingChangeSchema.version).toBe(1)
  })

  /** The shape of a row written by the build whose field name collided with RxDB's own. */
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
    const storage = getRxStorageDexie()
    const row = {
      id: 'cards:c1',
      collection: 'cards',
      entityId: 'c1',
      op: 'save',
      at: '2026-09-15T16:07:00.000Z',
    }

    // The broken build: the write reaches storage and *then* the document throws, which is how a
    // device ends up holding rows it can never read back.
    const broken = await createRxDatabase({ name: STORAGE_PREFIX, storage })
    const { pendingChanges } = await broken.addCollections({
      pendingChanges: { schema: v0PendingChangeSchema },
    })
    await expect(pendingChanges.upsert(row)).rejects.toThrow(/collection/)
    expect(await pendingChanges.storageInstance.findDocumentsById([row.id], true)).toHaveLength(1)
    await broken.close()

    // This build, opening the same database.
    const collections = await createAppDatabase(storage)
    const migrated = await collections.pendingChanges.find().exec()

    expect(migrated.map((document) => document.toMutableJSON() as PendingChange)).toEqual([
      {
        id: 'cards:c1',
        contentCollection: 'cards',
        entityId: 'c1',
        op: 'save',
        at: '2026-09-15T16:07:00.000Z',
      },
    ])

    await collections.pendingChanges.database.remove()
  })
})
