import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { InMemoryRepository } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import { EventBus } from '@/shared/lib'
import { createSessionStore, type Session, type SessionStore } from '@/entities/session'
import { createPalaceStore, type Palace, type PalaceStore } from '@/entities/palace'
import { createAppDatabase } from './persistence/database'

/** Domain events broadcast on the bus (Observer). Grows with each slice.
 * A `type` (not `interface`) so it satisfies the bus's `Record<string, unknown>`. */
export type ProgressEvents = {
  'xp-gain': { amount: number }
  'level-up': { level: number }
}

export interface Services {
  sessionStore: SessionStore
  palaceStore: PalaceStore
  eventBus: EventBus<ProgressEvents>
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
  return {
    sessionStore: createSessionStore(sessionRepo),
    palaceStore: createPalaceStore(palaceRepo),
    eventBus: new EventBus<ProgressEvents>(),
  }
}

/** App-wide singleton. Tests build isolated instances via `createServices()`. */
export const services: Services = createServices()
