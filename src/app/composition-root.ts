import {
  type AccountDeletionPort,
  type AuthGateway,
  type CloudSyncPort,
  InMemoryRepository,
  LocalObjectUrlStorage,
  type StoragePort,
} from '@/shared/api'
import type { SyncManager, SyncTarget } from '@/shared/api/supabase'
import { type AppEvents, EventBus, nowIso } from '@/shared/lib'
import {
  type ContentCollection,
  CORE_SYNC_TABLES,
  type SyncTableSpec,
} from '@/shared/config/sync-tables'
import { createSessionStore, type Session, type SessionStore } from '@/entities/session'
import { createDeckStore, type Deck, type DeckStore } from '@/entities/deck'
import { type Card, type CardStore, createCardStore } from '@/entities/card'
import { createFolderStore, type Folder, type FolderStore } from '@/entities/folder'
import { createQuestionStore, type Question, type QuestionStore } from '@/entities/question'
import { createProgressStore, type Progress, type ProgressStore } from '@/entities/progress'
import {
  createPreferencesStore,
  type Preferences,
  type PreferencesStore,
} from '@/entities/preferences'
import { createProfileStore, type Profile, type ProfileStore } from '@/entities/profile'
import {
  type AppNotification,
  createNotificationStore,
  type NotificationStore,
} from '@/entities/notification'
import {
  createHistoryStore,
  type HistoryEntry,
  type HistoryStore,
} from '@/entities/learning-history'
import {
  createPendingChangeStore,
  type PendingChange,
  type PendingChangeStore,
} from '@/entities/pending-change'
import { createSyncStateStore, type SyncState, type SyncStateStore } from '@/entities/sync-state'
import { createPendingChangePort } from '@/features/sync'
import { keepImagesCached } from '@/features/media'
import { loadExtensionCollections } from './extensions/collections'
import { createExtensionRuntime, type ExtensionRuntime } from './extensions/extension-runtime'
import { loadExtensions } from './extensions/load-extensions'
import { EXTENSIONS } from './extensions/registry'
import { resetLocalDatabase } from './persistence/reset-local-database'
import { adoptDeviceSettings } from './persistence/adopt-device-settings'
import { keepArchiveDetached } from './persistence/keep-archive-detached'
import { keepHistoryCapped } from './persistence/keep-history-capped'

export interface Services {
  authGateway: AuthGateway
  sessionStore: SessionStore
  deckStore: DeckStore
  cardStore: CardStore
  folderStore: FolderStore
  questionStore: QuestionStore
  progressStore: ProgressStore
  preferencesStore: PreferencesStore
  profileStore: ProfileStore
  notificationStore: NotificationStore
  historyStore: HistoryStore
  pendingChangeStore: PendingChangeStore
  syncStateStore: SyncStateStore
  eventBus: EventBus<AppEvents>
  storage: StoragePort
  accountDeletion: AccountDeletionPort | null
  syncManager: SyncManager | null
  cloudSync: CloudSyncPort | null
  resetLocalData: () => Promise<void>
  /** Switches extensions on and off as preferences say; what their screens and hosts read. */
  extensions: ExtensionRuntime
  /**
   * Every table that could replicate, core plus contributed, in the order replication runs them.
   * Each carries the extension that owns it, so the live subset is derived where preferences are
   * readable rather than guessed at here, before they have loaded.
   */
  syncTables: readonly SyncTableSpec[]
}

export async function createServices(): Promise<Services> {
  const [
    { getRxStorageDexie },
    { createAppDatabase, collectionByKey },
    { RxdbRepository },
    cloud,
    { createAuthGateway },
    { buildExtensionRepositories },
  ] = await Promise.all([
    import('rxdb/plugins/storage-dexie'),
    import('./persistence/database'),
    import('@/shared/api/rxdb'),
    import('@/shared/api/supabase'),
    import('./persistence/create-auth-gateway'),
    import('./extensions/repositories'),
  ])

  const [extensionCollections, loadedExtensions] = await Promise.all([
    loadExtensionCollections(EXTENSIONS),
    loadExtensions(EXTENSIONS),
  ])
  const collections = createAppDatabase(getRxStorageDexie(), extensionCollections.specs)
  const authGateway = createAuthGateway()
  const sessionRepo = new InMemoryRepository<Session>()
  const deckRepo = new RxdbRepository<Deck>(collections.then((c) => c.decks))
  const cardRepo = new RxdbRepository<Card>(collections.then((c) => c.cards))
  const folderRepo = new RxdbRepository<Folder>(collections.then((c) => c.folders))
  const questionRepo = new RxdbRepository<Question>(collections.then((c) => c.questions))
  const pendingChangeRepo = new RxdbRepository<PendingChange>(
    collections.then((c) => c.pendingChanges),
  )
  const syncStateRepo = new RxdbRepository<SyncState>(collections.then((c) => c.syncState))
  const pendingChangeStore = createPendingChangeStore(pendingChangeRepo)
  const pending = (collection: ContentCollection) =>
    createPendingChangePort(pendingChangeStore, collection, nowIso)
  const progressRepo = new RxdbRepository<Progress>(collections.then((c) => c.progress))
  const preferencesRepo = new RxdbRepository<Preferences>(collections.then((c) => c.preferences))
  const profileRepo = new RxdbRepository<Profile>(collections.then((c) => c.profiles))
  const notificationRepo = new RxdbRepository<AppNotification>(
    collections.then((c) => c.notifications),
  )
  const historyRepo = new RxdbRepository<HistoryEntry>(collections.then((c) => c.history))
  const syncTableSpecs: readonly SyncTableSpec[] = [
    ...CORE_SYNC_TABLES,
    ...extensionCollections.syncTables,
  ]
  const syncTargets: Promise<SyncTarget[]> = collections.then((c) =>
    syncTableSpecs.map(({ table, collectionKey, refuseUnseenOverwrites }) => ({
      table,
      collection: collectionByKey(c, collectionKey),
      refuseUnseenOverwrites,
    })),
  )
  const configured = cloud.isSupabaseConfigured()
  const syncManager = configured
    ? cloud.SyncManager.fromSupabase(cloud.supabase, syncTargets)
    : null
  const preferencesStore = createPreferencesStore(preferencesRepo)
  const services: Services = {
    authGateway,
    sessionStore: createSessionStore(sessionRepo),
    deckStore: createDeckStore(deckRepo, pending('decks')),
    cardStore: createCardStore(cardRepo, pending('cards')),
    folderStore: createFolderStore(folderRepo, pending('folders')),
    questionStore: createQuestionStore(questionRepo, pending('questions')),
    progressStore: createProgressStore(progressRepo),
    preferencesStore,
    profileStore: createProfileStore(profileRepo),
    notificationStore: createNotificationStore(notificationRepo),
    historyStore: createHistoryStore(historyRepo),
    pendingChangeStore,
    syncStateStore: createSyncStateStore(syncStateRepo),
    eventBus: new EventBus<AppEvents>(),
    storage: configured ? new cloud.SupabaseStorage(cloud.supabase) : new LocalObjectUrlStorage(),
    accountDeletion: configured ? new cloud.SupabaseAccountDeletion(cloud.supabase) : null,
    syncManager,
    cloudSync: syncManager ? cloud.createSupabaseCloudSync(cloud.supabase, syncManager) : null,
    resetLocalData: () => resetLocalDatabase({ collections }),
    extensions: createExtensionRuntime({
      extensions: loadedExtensions,
      preferences: preferencesStore,
      repositories: buildExtensionRepositories(extensionCollections.specs, collections),
    }),
    syncTables: syncTableSpecs,
  }

  for (const store of [
    services.deckStore,
    services.cardStore,
    services.folderStore,
    services.questionStore,
    services.progressStore,
    services.preferencesStore,
    services.profileStore,
    services.notificationStore,
    services.historyStore,
    services.pendingChangeStore,
    services.syncStateStore,
  ]) {
    store.getState().start()
  }

  keepArchiveDetached(services.deckStore)
  keepHistoryCapped(services.historyStore)
  // A failed write leaves the old keys for the next launch; it never fails boot.
  await adoptDeviceSettings(services.preferencesStore).catch((error: unknown) =>
    console.error('Device settings could not be adopted into preferences', error),
  )
  keepImagesCached({
    deckStore: services.deckStore,
    profileStore: services.profileStore,
    storage: services.storage,
  })
  // After the stores: an extension activated on the preferences it follows reads core stores too.
  services.extensions.start()

  return services
}
