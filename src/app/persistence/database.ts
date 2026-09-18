import type { RxCollection, RxStorage } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { Folder } from '@/entities/folder'
import { type CardStylePreset, completeDeck, type Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'
import type { HistoryEntry } from '@/entities/learning-history'
import type { PendingChange } from '@/entities/pending-change'
import type { ContentCollection } from '@/shared/config/sync-tables'
import type { SyncState } from '@/entities/sync-state'
import { coerceImagePath } from '@/shared/lib'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { DEFAULT_SELECT_TOOLBAR } from '@/shared/config/select-toolbar'
import { firstWriteWins, lastWriteWins } from '@/shared/api/rxdb'
import { mergeCardConflict, mergeProgressConflict } from './conflict-handlers'
import {
  cardSchema,
  deckSchema,
  folderSchema,
  notificationSchema,
  pendingChangeSchema,
  preferencesSchema,
  profileSchema,
  progressSchema,
  historySchema,
  questionSchema,
  syncStateSchema,
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
  history: RxCollection<HistoryEntry>
  pendingChanges: RxCollection<PendingChange>
  syncState: RxCollection<SyncState>
}

addRxPlugin(RxDBMigrationSchemaPlugin)

export const preferencesMigrations = {
  1: (doc: Preferences) => ({ ...doc, selectToolbar: DEFAULT_SELECT_TOOLBAR }),
  2: (doc: Preferences) => ({
    ...doc,
    studyTypeInitialsOnly: doc.studyTypeInitialsOnly ?? DEFAULT_PREFERENCES.studyTypeInitialsOnly,
  }),
  3: (doc: Preferences) => ({ ...doc, extensions: doc.extensions ?? [] }),
}

export const syncStateMigrations = {
  1: (doc: SyncState): SyncState => ({ ...doc, autosync: true }),
}

export const pendingChangeMigrations = {
  1: ({
    collection,
    ...rest
  }: Omit<PendingChange, 'contentCollection'> & {
    collection: ContentCollection
  }): PendingChange => ({ ...rest, contentCollection: collection }),
}

const RETIRED_PRESETS: Record<string, CardStylePreset> = { outlined: 'plain' }

export const deckMigrations = {
  1: (doc: Deck) => doc,
  2: (doc: Deck) => doc,
  3: (doc: Deck) => {
    const style = doc.settings?.cardStyle
    const preset = style && RETIRED_PRESETS[style.preset]
    if (!preset) return doc
    return { ...doc, settings: { ...doc.settings, cardStyle: { ...style, preset } } }
  },
  4: completeDeck,
}

/** v1 widened `kind` with `adjusted`; every stored entry is already valid. */
export const historyMigrations = {
  1: (doc: HistoryEntry) => doc,
}

export const cardMigrations = {
  1: (doc: Card) => ({ ...doc, frozen: doc.frozen ?? false, reversed: doc.reversed ?? false }),
}

const LEGACY_PHONE_KEY = 'mindscape:phone'

export const profileMigrations = {
  1: (doc: Profile) => {
    const phone = localStorage.getItem(LEGACY_PHONE_KEY) ?? ''
    localStorage.removeItem(LEGACY_PHONE_KEY)
    return { ...doc, phone }
  },
  2: (doc: Profile) => ({ ...doc, avatar: coerceImagePath(doc.avatar) }),
}

export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
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
    history: {
      schema: historySchema,
      migrationStrategies: historyMigrations,
      conflictHandler: firstWriteWins<HistoryEntry>(),
    },
    pendingChanges: { schema: pendingChangeSchema, migrationStrategies: pendingChangeMigrations },
    syncState: { schema: syncStateSchema, migrationStrategies: syncStateMigrations },
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
    history: collections.history,
    pendingChanges: collections.pendingChanges,
    syncState: collections.syncState,
  }
}
