import type { RxCollection } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import {
  type AuthGateway,
  type Identifiable,
  InMemoryRepository,
  LocalObjectUrlStorage,
  type StoragePort,
} from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import {
  isSupabaseConfigured,
  supabase,
  SupabaseStorage,
  SyncManager,
  type SyncTarget,
} from '@/shared/api/supabase'
import { type AppEvents, EventBus } from '@/shared/lib'
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
import { createAppDatabase } from './persistence/database'
import { resetLocalDatabase } from './persistence/reset-local-database'
import { createAuthGateway } from './persistence/create-auth-gateway'

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
  eventBus: EventBus<AppEvents>
  storage: StoragePort
  /** Null when no Supabase project is configured: the app then runs entirely on-device. */
  syncManager: SyncManager | null
  /** Wipes the device's database and reloads — only when a different account signs in. */
  resetLocalData: () => Promise<void>
}

/** Everything that mirrors to the cloud. `notifications` is ephemeral UI state and stays local. */
const SYNCED_TABLES = [
  'decks',
  'cards',
  'folders',
  'questions',
  'progress',
  'preferences',
  'profiles',
] as const

export function createServices(): Services {
  const collections = createAppDatabase(getRxStorageDexie())
  const authGateway = createAuthGateway()
  const sessionRepo = new InMemoryRepository<Session>()
  const deckRepo = new RxdbRepository<Deck>(collections.then((c) => c.decks))
  const cardRepo = new RxdbRepository<Card>(collections.then((c) => c.cards))
  const folderRepo = new RxdbRepository<Folder>(collections.then((c) => c.folders))
  const questionRepo = new RxdbRepository<Question>(collections.then((c) => c.questions))
  const progressRepo = new RxdbRepository<Progress>(collections.then((c) => c.progress))
  const preferencesRepo = new RxdbRepository<Preferences>(collections.then((c) => c.preferences))
  const profileRepo = new RxdbRepository<Profile>(collections.then((c) => c.profiles))
  const notificationRepo = new RxdbRepository<AppNotification>(
    collections.then((c) => c.notifications),
  )
  const syncTargets: Promise<SyncTarget[]> = collections.then((c) =>
    SYNCED_TABLES.map((table) => ({
      table,
      collection: c[table] as unknown as RxCollection<Identifiable>,
    })),
  )
  const services: Services = {
    authGateway,
    sessionStore: createSessionStore(sessionRepo),
    deckStore: createDeckStore(deckRepo),
    cardStore: createCardStore(cardRepo),
    folderStore: createFolderStore(folderRepo),
    questionStore: createQuestionStore(questionRepo),
    progressStore: createProgressStore(progressRepo),
    preferencesStore: createPreferencesStore(preferencesRepo),
    profileStore: createProfileStore(profileRepo),
    notificationStore: createNotificationStore(notificationRepo),
    eventBus: new EventBus<AppEvents>(),
    storage: isSupabaseConfigured() ? new SupabaseStorage(supabase) : new LocalObjectUrlStorage(),
    syncManager: isSupabaseConfigured() ? SyncManager.fromSupabase(supabase, syncTargets) : null,
    resetLocalData: () => resetLocalDatabase({ collections }),
  }

  // Every store observes its collection from here on. Screens read data and `selectIsReady`; none
  // owns the subscription. Session is deliberately absent — AuthProvider restores it once the
  // gateway answers.
  for (const store of [
    services.deckStore,
    services.cardStore,
    services.folderStore,
    services.questionStore,
    services.progressStore,
    services.preferencesStore,
    services.profileStore,
    services.notificationStore,
  ]) {
    store.getState().start()
  }

  return services
}

export const services: Services = createServices()
