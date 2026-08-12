import type { RxCollection, RxStorage } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { Folder } from '@/entities/folder'
import type { Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import type { Preferences } from '@/entities/preferences'
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

const preferencesMigrations = {
  1: (doc: Preferences) => ({ ...doc, selectToolbar: DEFAULT_SELECT_TOOLBAR }),
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
    decks: { schema: deckSchema, conflictHandler: lastWriteWins<Deck>() },
    cards: { schema: cardSchema, conflictHandler: mergeCardConflict },
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
