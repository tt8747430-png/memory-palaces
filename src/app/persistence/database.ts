import type { RxCollection, RxStorage } from 'rxdb'
import type { Identifiable } from '@/shared/api'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { Folder } from '@/entities/folder'
import { type CardStylePreset, completeDeck, type Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'
import { resolveDeckSort } from '@/shared/lib'
import { normalizeFlashcardSwipe, resolveFlashcardInput } from '@/shared/config/flashcard-swipe'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'
import type { HistoryEntry } from '@/entities/learning-history'
import type { PendingChange } from '@/entities/pending-change'
import type { ContentCollection } from '@/shared/config/sync-tables'
import type { SyncState } from '@/entities/sync-state'
import { coerceImagePath, type ExtensionCollectionSpec } from '@/shared/lib'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { DEFAULT_SELECT_TOOLBAR } from '@/shared/config/select-toolbar'
import { firstWriteWins, mergeAgainstBase } from '@/shared/api/rxdb'
import { AUTOSYNC_OFF_HANDOFF_KEY } from './adopt-device-settings'
import {
  mergeCardConflict,
  mergePreferencesConflict,
  mergeProgressConflict,
} from './conflict-handlers'
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
  /**
   * The registered extensions' collections, keyed as their manifests named them. Held apart from
   * the core ones rather than spread among them: the set is open, so nothing can type it per key,
   * and a caller that means to reach one should have to say so.
   */
  extensions: Readonly<Record<string, RxCollection<Identifiable>>>
}

/**
 * The collection a sync spec or an extension repository names — a core collection's own key, or
 * an extension's. The one place that widens the typed record, so no caller casts; the two
 * namespaces cannot collide, because `addCollections` throws on a duplicate key.
 */
export function collectionByKey(
  collections: AppCollections,
  key: string,
): RxCollection<Identifiable> {
  const { extensions, ...core } = collections
  const found =
    extensions[key] ?? (core as unknown as Record<string, RxCollection<Identifiable>>)[key]
  if (!found) throw new Error(`No collection is registered as "${key}"`)
  return found
}

addRxPlugin(RxDBMigrationSchemaPlugin)

export const preferencesMigrations = {
  1: (doc: Preferences) => ({ ...doc, selectToolbar: DEFAULT_SELECT_TOOLBAR }),
  2: (doc: Preferences) => ({
    ...doc,
    studyTypeInitialsOnly: doc.studyTypeInitialsOnly ?? DEFAULT_PREFERENCES.studyTypeInitialsOnly,
  }),
  3: (doc: Preferences) => ({ ...doc, extensions: doc.extensions ?? [] }),
  /**
   * Dev mode, Autosync and the Library's expanded rows follow the account now. The device's own
   * values are moved in by `adoptDeviceSettings`, which also covers a device with no document.
   */
  4: (doc: Preferences): Preferences => ({
    ...doc,
    devMode: doc.devMode ?? DEFAULT_PREFERENCES.devMode,
    autosync: doc.autosync ?? DEFAULT_PREFERENCES.autosync,
    libraryExpanded: doc.libraryExpanded ?? [...DEFAULT_PREFERENCES.libraryExpanded],
  }),
  /**
   * Two changes, one step. A flashcard swipe belongs to a Learning algorithm now: whatever was
   * stored was chosen where only Grades were on offer, so it becomes the Spaced repetition setting
   * and Fast review starts from its own defaults. And an extension can now have parts of it
   * switched off, which nobody has done yet.
   *
   * `normalizeFlashcardSwipe` is the read-side twin of the first half: replication writes pulled
   * rows unmigrated, so the entity recognises the old shapes too.
   */
  5: (doc: Preferences): Preferences => ({
    ...doc,
    flashcardSwipe: normalizeFlashcardSwipe(doc.flashcardSwipe),
    disabledFeatures: doc.disabledFeatures ?? {},
  }),
  /**
   * A flashcard can be answered by tapping an edge rather than throwing the card, and the Library
   * can be put in an order other than the one a drag wrote. Both start where the app has always
   * behaved — a swipe, and the manual order — so nobody's device changes under them.
   *
   * `resolveFlashcardInput` and `resolveDeckSort` are the read-side twins: replication writes
   * pulled rows unmigrated, so a document from a device still on version 5 arrives without either.
   */
  6: (doc: Preferences): Preferences => ({
    ...doc,
    flashcardInput: resolveFlashcardInput(doc.flashcardInput),
    deckSort: resolveDeckSort(doc.deckSort),
    deckSortSubdecks: doc.deckSortSubdecks ?? DEFAULT_PREFERENCES.deckSortSubdecks,
  }),
}

type SyncStateV2 = Omit<SyncState, 'log'>
type SyncStateV1 = SyncStateV2 & { autosync: boolean }

export const syncStateMigrations = {
  1: (doc: SyncStateV2): SyncStateV1 => ({ ...doc, autosync: true }),
  /**
   * Autosync moved into Preferences. The field goes, but a learner who had switched it off keeps
   * that choice: the migration hands it to `adoptDeviceSettings`, which cannot read this collection
   * once the field is gone.
   */
  2: ({ autosync, ...doc }: SyncStateV1): SyncStateV2 => {
    if (!autosync) localStorage.setItem(AUTOSYNC_OFF_HANDOFF_KEY, '1')
    return doc
  },
  /** The device starts remembering its recent Syncs. */
  3: (doc: SyncStateV2): SyncState => ({ ...doc, log: [] }),
}

type PendingChangeV0 = Omit<PendingChange, 'table'> & { collection: ContentCollection }
type PendingChangeV1 = Omit<PendingChange, 'table'> & { contentCollection: ContentCollection }

export const pendingChangeMigrations = {
  1: ({ collection, ...rest }: PendingChangeV0): PendingChangeV1 => ({
    ...rest,
    contentCollection: collection,
  }),
  /** The log covers every synced table now, so the field names a table rather than a content kind. */
  2: ({ contentCollection, ...rest }: PendingChangeV1): PendingChange => ({
    ...rest,
    table: contentCollection,
  }),
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
  extensionCollections: readonly ExtensionCollectionSpec[] = [],
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const collections = await database.addCollections({
    decks: {
      schema: deckSchema,
      migrationStrategies: deckMigrations,
      conflictHandler: mergeAgainstBase<Deck>(),
    },
    cards: {
      schema: cardSchema,
      migrationStrategies: cardMigrations,
      conflictHandler: mergeCardConflict,
    },
    folders: { schema: folderSchema, conflictHandler: mergeAgainstBase<Folder>() },
    questions: {
      schema: questionSchema,
      conflictHandler: mergeAgainstBase<Question>(),
    },
    progress: { schema: progressSchema, conflictHandler: mergeProgressConflict },
    preferences: {
      schema: preferencesSchema,
      migrationStrategies: preferencesMigrations,
      conflictHandler: mergePreferencesConflict,
    },
    profiles: {
      schema: profileSchema,
      migrationStrategies: profileMigrations,
      conflictHandler: mergeAgainstBase<Profile>(),
    },
    notifications: { schema: notificationSchema },
    history: {
      schema: historySchema,
      migrationStrategies: historyMigrations,
      conflictHandler: firstWriteWins<HistoryEntry>(),
    },
    pendingChanges: { schema: pendingChangeSchema, migrationStrategies: pendingChangeMigrations },
    syncState: { schema: syncStateSchema, migrationStrategies: syncStateMigrations },
    // Registered whether or not the extension is enabled: a schema the database does not know is
    // a schema replication can orphan rows against. Only replication follows the toggle.
    ...Object.fromEntries(extensionCollections.map((spec) => [spec.key, spec.creator] as const)),
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
    // `addCollections` types only the literal keys it was handed, so the contributed ones are read
    // back through one widening here — the same shape `collectionByKey` hands out.
    extensions: Object.fromEntries(
      extensionCollections.map(
        (spec) =>
          [
            spec.key,
            (collections as unknown as Record<string, RxCollection<Identifiable>>)[spec.key]!,
          ] as const,
      ),
    ),
  }
}
