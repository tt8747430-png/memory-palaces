import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { InMemoryRepository } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import { EventBus, type AppEvents } from '@/shared/lib'
import { createSessionStore, type Session, type SessionStore } from '@/entities/session'
import { createPalaceStore, type Palace, type PalaceStore } from '@/entities/palace'
import { createRoomStore, type Room, type RoomStore } from '@/entities/room'
import { createLocusStore, type Locus, type LocusStore } from '@/entities/locus'
import { createQuestionStore, type Question, type QuestionStore } from '@/entities/question'
import { createProgressStore, type Progress, type ProgressStore } from '@/entities/progress'
import {
  createPreferencesStore,
  type Preferences,
  type PreferencesStore,
} from '@/entities/preferences'
import {
  createNotificationStore,
  type AppNotification,
  type NotificationStore,
} from '@/entities/notification'
import { createAppDatabase } from './persistence/database'

export interface Services {
  sessionStore: SessionStore
  palaceStore: PalaceStore
  roomStore: RoomStore
  locusStore: LocusStore
  questionStore: QuestionStore
  progressStore: ProgressStore
  preferencesStore: PreferencesStore
  notificationStore: NotificationStore
  eventBus: EventBus<AppEvents>
}

/**
 * Composition root — the ONE place concrete adapters are chosen and injected into
 * ports. Palaces now persist to RxDB (IndexedDB via Dexie); the database is created
 * eagerly and its collection promise handed to the adapter, so construction stays
 * synchronous. `createServices()` keeps it all reconstructable for tests.
 */
export function createServices(): Services {
  const collections = createAppDatabase(getRxStorageDexie())
  const sessionRepo = new InMemoryRepository<Session>() // → RxDB in a later slice
  const palaceRepo = new RxdbRepository<Palace>(collections.then((c) => c.palaces))
  const roomRepo = new RxdbRepository<Room>(collections.then((c) => c.rooms))
  const locusRepo = new RxdbRepository<Locus>(collections.then((c) => c.loci))
  const questionRepo = new RxdbRepository<Question>(collections.then((c) => c.questions))
  const progressRepo = new RxdbRepository<Progress>(collections.then((c) => c.progress))
  const preferencesRepo = new RxdbRepository<Preferences>(collections.then((c) => c.preferences))
  const notificationRepo = new RxdbRepository<AppNotification>(
    collections.then((c) => c.notifications),
  )
  return {
    sessionStore: createSessionStore(sessionRepo),
    palaceStore: createPalaceStore(palaceRepo),
    roomStore: createRoomStore(roomRepo),
    locusStore: createLocusStore(locusRepo),
    questionStore: createQuestionStore(questionRepo),
    progressStore: createProgressStore(progressRepo),
    preferencesStore: createPreferencesStore(preferencesRepo),
    notificationStore: createNotificationStore(notificationRepo),
    eventBus: new EventBus<AppEvents>(),
  }
}

/** App-wide singleton. Tests build isolated instances via `createServices()`. */
export const services: Services = createServices()
