import type { SessionKind } from './types'
import type { SessionState } from './store'

/** Guest, account, or nobody — what the sync surfaces branch on before anything else. */
export const selectSessionKind = (state: SessionState): SessionKind | null =>
  state.session?.kind ?? null

/**
 * The signed-in account's id, or null for a guest or nobody. Storage prefixes and replication
 * belong to an account; a guest's photos stay inside the document and their data stays on-device.
 */
export const selectAccountId = (state: SessionState): string | null =>
  state.session?.kind === 'account' ? state.session.id : null
