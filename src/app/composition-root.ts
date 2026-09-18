import {
  type AccountDeletionPort,
  type AuthGateway,
  type CloudSyncPort,
  InMemoryRepository,
  LocalObjectUrlStorage,
  type StoragePort,
} from '@/shared/api'
import type { SyncManager, SyncTarget } from '@/shared/api/supabase'
import { type AppEvents, EventBus, type ExtensionRepositories, nowIso } from '@/shared/lib'
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
  isExtensionEnabled,
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
import { EXTENSIONS } from './extensions/registry'
import { resetLocalDatabase } from './persistence/reset-local-database'
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
  extensionRepositories: ExtensionRepositories
  /** Core plus contributed, in the order replication runs them. */
  syncTables: readonly string[]
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

  const extensions = await loadExtensionCollections(EXTENSIONS)
  const collections = createAppDatabase(getRxStorageDexie(), extensions.specs)
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
  const syncTableSpecs: SyncTableSpec[] = [...CORE_SYNC_TABLES, ...extensions.syncTables]
  const syncTargets: Promise<SyncTarget[]> = collections.then((c) =>
    syncTableSpecs.map(({ table, collectionKey }) => ({
      table,
      collection: collectionByKey(c, collectionKey),
    })),
  )
  const configured = cloud.isSupabaseConfigured()
  /**
   * An extension's table joins the sync set only while the extension is enabled. Read at cycle
   * time, not here: preferences have not loaded when `createServices()` runs.
   */
  const tableIsActive = (table: string): boolean => {
    const owner = extensions.ownerOf.get(table)
    if (!owner) return true
    const prefs = services.preferencesStore.getState().preferences
    return prefs ? isExtensionEnabled(prefs, owner) : false
  }
  const syncManager = configured
    ? cloud.SyncManager.fromSupabase(
        cloud.supabase,
        syncTargets,
        syncTableSpecs.map((spec) => spec.table),
        tableIsActive,
      )
    : null
  const services: Services = {
    authGateway,
    sessionStore: createSessionStore(sessionRepo),
    deckStore: createDeckStore(deckRepo, pending('decks')),
    cardStore: createCardStore(cardRepo, pending('cards')),
    folderStore: createFolderStore(folderRepo, pending('folders')),
    questionStore: createQuestionStore(questionRepo, pending('questions')),
    progressStore: createProgressStore(progressRepo),
    preferencesStore: createPreferencesStore(preferencesRepo),
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
    extensionRepositories: buildExtensionRepositories(extensions.specs, collections),
    syncTables: syncTableSpecs.map((spec) => spec.table),
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
  keepImagesCached({
    deckStore: services.deckStore,
    profileStore: services.profileStore,
    storage: services.storage,
  })

  return services
}
