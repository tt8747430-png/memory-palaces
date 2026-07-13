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

// Stored preferences outlive any release, so a schema bump migrates them.
addRxPlugin(RxDBMigrationSchemaPlugin)

/** v0 → v1: learners stored before the select toolbar was configurable get the
 *  bar they have been using all along. */
const preferencesMigrations = {
  1: (doc: Preferences) => ({ ...doc, selectToolbar: DEFAULT_SELECT_TOOLBAR }),
}

export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const collections = await database.addCollections({
    decks: { schema: deckSchema },
    cards: { schema: cardSchema },
    folders: { schema: folderSchema },
    questions: { schema: questionSchema },
    progress: { schema: progressSchema },
    preferences: { schema: preferencesSchema, migrationStrategies: preferencesMigrations },
    profiles: { schema: profileSchema },
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
