import type { RxCollection } from 'rxdb'
import {
  type AccountDeletionPort,
  type AuthGateway,
  type CloudSyncPort,
  type Identifiable,
  InMemoryRepository,
  LocalObjectUrlStorage,
  type StoragePort,
} from '@/shared/api'
import type { SyncManager, SyncTarget } from '@/shared/api/supabase'
import { type AppEvents, EventBus, nowIso } from '@/shared/lib'
import { type ContentCollection, SYNCED_TABLES } from '@/shared/config/sync-tables'
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
}

export async function createServices(): Promise<Services> {
  const [
    { getRxStorageDexie },
    { createAppDatabase },
    { RxdbRepository },
    cloud,
    { createAuthGateway },
  ] = await Promise.all([
    import('rxdb/plugins/storage-dexie'),
    import('./persistence/database'),
    import('@/shared/api/rxdb'),
    import('@/shared/api/supabase'),
    import('./persistence/create-auth-gateway'),
  ])

  const collections = createAppDatabase(getRxStorageDexie())
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
  const syncTargets: Promise<SyncTarget[]> = collections.then((c) =>
    SYNCED_TABLES.map((table) => ({
      table,
      collection: c[table] as unknown as RxCollection<Identifiable>,
    })),
  )
  const configured = cloud.isSupabaseConfigured()
  const syncManager = configured
    ? cloud.SyncManager.fromSupabase(cloud.supabase, syncTargets)
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
