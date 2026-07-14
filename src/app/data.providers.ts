import { makeEnvironmentProviders } from '@angular/core'
import type { EnvironmentProviders } from '@angular/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { InMemoryRepository } from '@app/shared/data'
import { RxdbRepository } from '@app/shared/data/rxdb-repository'
import {
  DECK_REPOSITORY,
  CARD_REPOSITORY,
  QUESTION_REPOSITORY,
  FOLDER_REPOSITORY,
} from '@app/decks/data/stores'
import { PROGRESS_REPOSITORY } from '@app/study/data/progress-store'
import { PREFERENCES_REPOSITORY } from '@app/settings/data/preferences-store'
import { NOTIFICATION_REPOSITORY } from '@app/notifications/data/notification-store'
import { SESSION_REPOSITORY, PROFILE_REPOSITORY, AUTH_GATEWAY } from '@app/auth/data/stores'
import { LocalAuthGateway } from '@app/auth/data/local-auth-gateway'
import type { Session } from '@app/auth/model/session'
import { createAppDatabase } from './app-database'

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
  ])
}
