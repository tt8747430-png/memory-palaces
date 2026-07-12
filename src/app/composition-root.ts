import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { type AuthGateway, InMemoryRepository } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
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
import { LocalAuthGateway } from './persistence/local-auth-gateway'

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
}

export function createServices(): Services {
  const collections = createAppDatabase(getRxStorageDexie())
  const authGateway = new LocalAuthGateway()
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
  return {
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
  }
}

export const services: Services = createServices()
