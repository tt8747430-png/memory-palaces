import type { RxCollection, RxStorage } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { Folder } from '@/entities/folder'
import type { Palace } from '@/entities/palace'
import type { Room } from '@/entities/room'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import type { Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import {
  folderSchema,
  locusSchema,
  notificationSchema,
  palaceSchema,
  preferencesSchema,
  profileSchema,
  progressSchema,
  questionSchema,
  roomSchema,
} from './schemas'
import {
  migrateFolderV1,
  migrateLocusV1,
  migratePalaceV1,
  migratePreferencesV1,
  migratePreferencesV2,
  migratePreferencesV3,
  migratePreferencesV4,
  migratePreferencesV5,
  migratePreferencesV6,
  migrateProfileV1,
  migrateProgressV1,
  migrateQuestionV1,
} from './migrations'

// Required because the preferences (v2) and profiles (v1) collections carry
// migrationStrategies; without this RxDB throws "function must be overwritten by a
// plugin" the moment the database is created.
addRxPlugin(RxDBMigrationSchemaPlugin)

export interface AppCollections {
  palaces: RxCollection<Palace>
  folders: RxCollection<Folder>
  rooms: RxCollection<Room>
  loci: RxCollection<Locus>
  questions: RxCollection<Question>
  progress: RxCollection<Progress>
  preferences: RxCollection<Preferences>
  profiles: RxCollection<Profile>
  notifications: RxCollection<AppNotification>
}

/**
 * Create the on-device RxDB database and its entity collections. Storage is injected
 * (Dexie/IndexedDB in the browser); the composition root calls this once and wires the
 * collections into `RxdbRepository` adapters behind the entity ports.
 */
export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const collections = await database.addCollections({
    palaces: { schema: palaceSchema, migrationStrategies: { 1: migratePalaceV1 } },
    folders: { schema: folderSchema, migrationStrategies: { 1: migrateFolderV1 } },
    rooms: { schema: roomSchema },
    loci: { schema: locusSchema, migrationStrategies: { 1: migrateLocusV1 } },
    questions: { schema: questionSchema, migrationStrategies: { 1: migrateQuestionV1 } },
    progress: { schema: progressSchema, migrationStrategies: { 1: migrateProgressV1 } },
    preferences: {
      schema: preferencesSchema,
      migrationStrategies: {
        1: migratePreferencesV1,
        2: migratePreferencesV2,
        3: migratePreferencesV3,
        4: migratePreferencesV4,
        5: migratePreferencesV5,
        6: migratePreferencesV6,
      },
    },
    profiles: {
      schema: profileSchema,
      migrationStrategies: { 1: migrateProfileV1 },
    },
    notifications: { schema: notificationSchema },
  })
  return {
    palaces: collections.palaces,
    folders: collections.folders,
    rooms: collections.rooms,
    loci: collections.loci,
    questions: collections.questions,
    progress: collections.progress,
    preferences: collections.preferences,
    profiles: collections.profiles,
    notifications: collections.notifications,
  }
}
