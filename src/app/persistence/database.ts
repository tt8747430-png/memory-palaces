import type { RxCollection, RxStorage } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { Folder } from '@/entities/folder'
import type { CardStylePreset, Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { DEFAULT_SELECT_TOOLBAR } from '@/shared/config/select-toolbar'
import { lastWriteWins, mergeCardConflict, mergeProgressConflict } from './conflict-handlers'
import {
  cardSchema,
  deckSchema,
  folderSchema,
  notificationSchema,
  preferencesSchema,
  profileSchema,
  progressSchema,
  questionSchema,
} from './schemas'

export interface AppCollections {
  decks: RxCollection<Deck>
  cards: RxCollection<Card>
  folders: RxCollection<Folder>
  questions: RxCollection<Question>
  progress: RxCollection<Progress>
  preferences: RxCollection<Preferences>
  profiles: RxCollection<Profile>
  notifications: RxCollection<AppNotification>
}

addRxPlugin(RxDBMigrationSchemaPlugin)

/**
 * v2 made Type mode's initials-only recall a stored preference instead of a toggle that lived and
 * died with the study session. Required by the schema, so a document written before it has to be
 * given the answer the toggle used to start on.
 */
export const preferencesMigrations = {
  1: (doc: Preferences) => ({ ...doc, selectToolbar: DEFAULT_SELECT_TOOLBAR }),
  2: (doc: Preferences) => ({
    ...doc,
    studyTypeInitialsOnly: doc.studyTypeInitialsOnly ?? DEFAULT_PREFERENCES.studyTypeInitialsOnly,
  }),
}

/**
 * The card-style presets a version has retired, each mapped to what it becomes. Keyed by `string`
 * because a retired id is by definition no longer a `CardStylePreset` — and a map rather than a
 * constant because one retirement is a list waiting to happen, and the next one should be a line
 * here rather than another shape.
 */
const RETIRED_PRESETS: Record<string, CardStylePreset> = { outlined: 'plain' }

/**
 * A deck written before this version simply lacks the new settings keys, and `resolveDeckSettings`
 * already answers a missing key with the default — so there is nothing to rewrite. The version bump
 * exists because the schema's shape changed, not because the documents did.
 *
 * v2 widened the card-style preset enum for the two new scenes. Nothing was renamed or removed, so
 * every preset a v1 deck can be carrying is still one v2 accepts, and this is identity too.
 *
 * v3 is the first that is not. It widened the enum again — five new scenes and a handwriting face —
 * but it also *removed* `outlined`, so a deck still carrying that preset names a value the schema
 * will not accept, and the collection would refuse to write it. Only the preset is replaced: the
 * font, size and alignment are the learner's own choices and survive the repaint, which is what the
 * spread says. A document missing some of those keys stays missing them, because that is already
 * answered a layer up — `resolveDeckSettings` fills an absent key with the default on read.
 *
 * This covers the documents on *this* device and nothing else. Replication writes pulled rows
 * straight into the collection without running a migration strategy, so a second device that has
 * not upgraded can still deliver `outlined` afterwards; `coerceCardStyle` is what catches that, and
 * the two are deliberate halves of the same guarantee.
 */
export const deckMigrations = {
  1: (doc: Deck) => doc,
  2: (doc: Deck) => doc,
  3: (doc: Deck) => {
    const style = doc.settings?.cardStyle
    const preset = style && RETIRED_PRESETS[style.preset]
    if (!preset) return doc
    return { ...doc, settings: { ...doc.settings, cardStyle: { ...style, preset } } }
  },
}

/** Frozen and reversed are required, so every card that predates them is given the quiet answer. */
export const cardMigrations = {
  1: (doc: Card) => ({ ...doc, frozen: doc.frozen ?? false, reversed: doc.reversed ?? false }),
}

/** Where the phone number was kept back when it never left the device. */
const LEGACY_PHONE_KEY = 'mindscape:phone'

/**
 * The phone number used to live in localStorage, so it was lost on reinstall and invisible on a
 * second device. It is a profile field now: the migration lifts whatever was stored into the
 * document that syncs, and drops the key behind it.
 */
const profileMigrations = {
  1: (doc: Profile) => {
    const phone = localStorage.getItem(LEGACY_PHONE_KEY) ?? ''
    localStorage.removeItem(LEGACY_PHONE_KEY)
    return { ...doc, phone }
  },
}

export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  // Conflict handlers only ever run for replicated collections, but they belong to the collection,
  // not the replication — so they are declared once here. `notifications` is device-local and
  // deliberately keeps RxDB's default.
  const collections = await database.addCollections({
    decks: {
      schema: deckSchema,
      migrationStrategies: deckMigrations,
      conflictHandler: lastWriteWins<Deck>(),
    },
    cards: {
      schema: cardSchema,
      migrationStrategies: cardMigrations,
      conflictHandler: mergeCardConflict,
    },
    folders: { schema: folderSchema, conflictHandler: lastWriteWins<Folder>() },
    questions: {
      schema: questionSchema,
      conflictHandler: lastWriteWins<Question>(),
    },
    progress: { schema: progressSchema, conflictHandler: mergeProgressConflict },
    preferences: {
      schema: preferencesSchema,
      migrationStrategies: preferencesMigrations,
      conflictHandler: lastWriteWins<Preferences>(),
    },
    profiles: {
      schema: profileSchema,
      migrationStrategies: profileMigrations,
      conflictHandler: lastWriteWins<Profile>(),
    },
    notifications: { schema: notificationSchema },
  })
  return {
    decks: collections.decks,
    cards: collections.cards,
    folders: collections.folders,
    questions: collections.questions,
    progress: collections.progress,
    preferences: collections.preferences,
    profiles: collections.profiles,
    notifications: collections.notifications,
  }
}
