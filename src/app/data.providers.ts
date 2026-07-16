import { inject, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core'
import type { EnvironmentProviders } from '@angular/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { InMemoryRepository } from '@app/shared/data'
import { RxdbRepository } from '@app/shared/data/rxdb-repository'
import {
  DECK_REPOSITORY,
  CARD_REPOSITORY,
  QUESTION_REPOSITORY,
  FOLDER_REPOSITORY,
  DeckStore,
  CardStore,
  QuestionStore,
  FolderStore,
} from '@app/decks'
import { PROGRESS_REPOSITORY, ProgressStore } from '@app/study'
import { PREFERENCES_REPOSITORY, PreferencesStore } from '@app/settings'
import { NOTIFICATION_REPOSITORY, NotificationStore } from '@app/notifications'
import {
  SESSION_REPOSITORY,
  PROFILE_REPOSITORY,
  AUTH_GATEWAY,
  ProfileStore,
  LocalAuthGateway,
} from '@app/auth'
import type { Session } from '@app/auth'
import { createAppDatabase } from './app-database'

/**
 * Every reactive store subscribes to its repository once, here, at bootstrap —
 * so a page can read a store without first remembering to start it. `start()`
 * is idempotent, so ordering never matters.
 *
 * SessionStore is absent by design: auth state is loaded once by `restoreSession`
 * in the app shell, not mirrored from a live query.
 */
function startReactiveStores(): void {
  const stores = [
    inject(DeckStore),
    inject(CardStore),
    inject(QuestionStore),
    inject(FolderStore),
    inject(NotificationStore),
    inject(ProfileStore),
    inject(PreferencesStore),
    inject(ProgressStore),
  ]
  for (const store of stores) store.start()
}

/**
 * Composition root: one on-device RxDB database (Dexie/IndexedDB) provides
 * every entity repository. The session lives in memory — auth state is
 * re-derived from the AuthGateway on each launch, never persisted in RxDB.
 */
export function provideAppData(): EnvironmentProviders {
  const collections = createAppDatabase(getRxStorageDexie())
  return makeEnvironmentProviders([
    { provide: AUTH_GATEWAY, useClass: LocalAuthGateway },
    { provide: SESSION_REPOSITORY, useValue: new InMemoryRepository<Session>() },
    { provide: DECK_REPOSITORY, useValue: new RxdbRepository(collections.then((c) => c.decks)) },
    { provide: CARD_REPOSITORY, useValue: new RxdbRepository(collections.then((c) => c.cards)) },
    {
      provide: FOLDER_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.folders)),
    },
    {
      provide: QUESTION_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.questions)),
    },
    {
      provide: PROGRESS_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.progress)),
    },
    {
      provide: PREFERENCES_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.preferences)),
    },
    {
      provide: PROFILE_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.profiles)),
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useValue: new RxdbRepository(collections.then((c) => c.notifications)),
    },
    provideEnvironmentInitializer(startReactiveStores),
  ])
}
