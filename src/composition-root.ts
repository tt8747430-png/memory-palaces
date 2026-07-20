import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { createAppDatabase } from '@/database'
import { InMemoryRepository } from '@/shared/data/in-memory-repository'
import { RxdbRepository } from '@/shared/data/rxdb-repository'
import { EventBus } from '@/shared/domain/event-bus'
import type { AppEvents } from '@/shared/domain'
import { CardStore, DeckStore, FolderStore, QuestionStore } from '@/decks/data/stores'
import { ProfileStore, SessionStore } from '@/auth/data/stores'
import { LocalAuthGateway } from '@/auth/data/local-auth-gateway'
import type { AuthGateway } from '@/auth/data/auth-gateway'
import { ProgressStore } from '@/progress/data/progress-store'
import { PreferencesStore } from '@/settings/data/preferences-store'
import { NotificationStore } from '@/notifications/data/notification-store'
import { ImportDraftStore } from '@/import/data/import-draft-store'

export interface Services {
  deckStore: DeckStore
  folderStore: FolderStore
  cardStore: CardStore
  questionStore: QuestionStore
  profileStore: ProfileStore
  sessionStore: SessionStore
  progressStore: ProgressStore
  preferencesStore: PreferencesStore
  notificationStore: NotificationStore
  importDraftStore: ImportDraftStore
  /** The second port beside Repository<T>. LocalAuthGateway is its adapter. */
  authGateway: AuthGateway
  eventBus: EventBus<AppEvents>
}

/**
 * Every reactive store is started here, once — never from a component (ADR-0008).
 * `start()` is idempotent, so this is safe to call more than once.
 */
function startAll(services: Services): void {
  services.deckStore.start()
  services.folderStore.start()
  services.cardStore.start()
  services.questionStore.start()
  services.profileStore.start()
  services.progressStore.start()
  services.preferencesStore.start()
  services.notificationStore.start()
  // SessionStore has no start() and is excluded by design: auth state is loaded once
  // by restoreSession (via its load()), not mirrored from a live query.
}

/** Production composition root: RxDB adapters behind every port. */
export async function createServices(): Promise<Services> {
  const db = await createAppDatabase(getRxStorageDexie())
  const services: Services = {
    deckStore: new DeckStore(new RxdbRepository(db.decks)),
    folderStore: new FolderStore(new RxdbRepository(db.folders)),
    cardStore: new CardStore(new RxdbRepository(db.cards)),
    questionStore: new QuestionStore(new RxdbRepository(db.questions)),
    profileStore: new ProfileStore(new RxdbRepository(db.profiles)),
    // Session is never persisted in RxDB (there is no session collection): auth
    // state is re-derived from the AuthGateway on each launch. In-memory even in
    // production — this matches the Angular composition root exactly.
    sessionStore: new SessionStore(new InMemoryRepository()),
    progressStore: new ProgressStore(new RxdbRepository(db.progress)),
    preferencesStore: new PreferencesStore(new RxdbRepository(db.preferences)),
    notificationStore: new NotificationStore(new RxdbRepository(db.notifications)),
    importDraftStore: new ImportDraftStore(),
    authGateway: new LocalAuthGateway(),
    eventBus: new EventBus<AppEvents>(),
  }
  startAll(services)
  return services
}

/**
 * Test composition root: the same seam, in-memory adapters. Stores are NOT started —
 * unit tests arrange that precondition themselves (ADR-0008).
 */
export function createTestServices(): Services {
  return {
    deckStore: new DeckStore(new InMemoryRepository()),
    folderStore: new FolderStore(new InMemoryRepository()),
    cardStore: new CardStore(new InMemoryRepository()),
    questionStore: new QuestionStore(new InMemoryRepository()),
    profileStore: new ProfileStore(new InMemoryRepository()),
    sessionStore: new SessionStore(new InMemoryRepository()),
    progressStore: new ProgressStore(new InMemoryRepository()),
    preferencesStore: new PreferencesStore(new InMemoryRepository()),
    notificationStore: new NotificationStore(new InMemoryRepository()),
    importDraftStore: new ImportDraftStore(),
    authGateway: new LocalAuthGateway(),
    eventBus: new EventBus<AppEvents>(),
  }
}
