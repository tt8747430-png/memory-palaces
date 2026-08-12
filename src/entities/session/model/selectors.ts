import type { SessionState } from './store'

/**
 * The signed-in account's id, or null for a guest or nobody. Storage prefixes and replication
 * belong to an account; a guest's photos stay inside the document and their data stays on-device.
 */
export const selectAccountId = (state: SessionState): string | null =>
  state.session?.kind === 'account' ? state.session.id : null
