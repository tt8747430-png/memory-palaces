import type { Repository } from '@/shared/api'
import type { Session } from '../model/types'

/**
 * Port for persisting the session. Currently the generic CRUD repo specialized to
 * Session; if it needs to narrow later (Interface Segregation), it changes here
 * only — adapters and the composition root follow.
 */
export type SessionRepository = Repository<Session>
