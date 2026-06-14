import { InMemoryRepository } from '@/shared/api'
import { EventBus } from '@/shared/lib'
import { createSessionStore, type Session, type SessionStore } from '@/entities/session'

/** Domain events broadcast on the bus (Observer). Grows with each slice.
 * A `type` (not `interface`) so it satisfies the bus's `Record<string, unknown>`. */
export type ProgressEvents = {
  'xp-gain': { amount: number }
  'level-up': { level: number }
}

export interface Services {
  sessionStore: SessionStore
  eventBus: EventBus<ProgressEvents>
}

/**
 * Composition root — the ONE place concrete adapters are chosen and injected into
 * ports. Swap `InMemoryRepository` for the RxDB adapter in Phase 3 with no change to
 * any entity/feature. `createServices()` keeps it reconstructable for tests.
 */
export function createServices(): Services {
  const sessionRepo = new InMemoryRepository<Session>() // → RxDB (Phase 3)
  return {
    sessionStore: createSessionStore(sessionRepo),
    eventBus: new EventBus<ProgressEvents>(),
  }
}

/** App-wide singleton. Tests build isolated instances via `createServices()`. */
export const services: Services = createServices()
