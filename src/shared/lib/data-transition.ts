import type { PersistedAuth } from '@/shared/api'

export type DataTransition = 'preserve' | 'reset' | 'none'

/**
 * What must happen to the on-device data when the identity changes.
 *
 * - A guest (or a fresh install) signing in **preserves**: everything studied so far is theirs, and
 *   replication pushes it into the new account.
 * - Switching to a *different* account **resets**: the previous account's decks must not leak into
 *   it, and the server has the truth for whoever just signed in.
 * - The same account, or signing out, changes nothing — signing out leaves the data where it is so
 *   coming back is instant.
 */
export function resolveDataTransition(
  previous: PersistedAuth | null,
  next: PersistedAuth | null,
): DataTransition {
  if (!next || next.kind !== 'account') return 'none'
  if (!previous || previous.kind === 'guest') return 'preserve'
  return previous.id === next.id ? 'none' : 'reset'
}
