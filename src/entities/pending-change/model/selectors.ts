import { CONTENT_COLLECTIONS, type ContentCollection } from '@/shared/config/sync-tables'
import type { PendingChange } from './types'
import type { PendingChangeState } from './store'

export const selectPendingChanges = (state: PendingChangeState): PendingChange[] =>
  state.pendingChanges

/** What the banner counts. Every entry is a content document, so there is nothing to filter out. */
export const selectPendingCount = (state: PendingChangeState): number => state.pendingChanges.length

/**
 * When the newest pending write happened, or null with nothing pending. What Autosync's debounce
 * watches: the count stays put while one document is edited over and over — the entries collapse
 * onto one — but every write moves this.
 */
export const selectLatestPendingAt = (state: PendingChangeState): string | null =>
  state.pendingChanges.reduce<string | null>(
    (latest, change) => (latest === null || change.at > latest ? change.at : latest),
    null,
  )

/**
 * The count per kind, for the breakdown in Settings → Sync. A plain function over the rows rather
 * than a selector, because it builds a fresh object every call and would never compare equal to
 * the last one — screens call it inside a `useMemo` over `selectPendingChanges`.
 */
export function pendingByCollection(
  changes: readonly PendingChange[],
): Record<ContentCollection, number> {
  const counts = Object.fromEntries(
    CONTENT_COLLECTIONS.map((collection) => [collection, 0]),
  ) as Record<ContentCollection, number>
  for (const change of changes) counts[change.collection] += 1
  return counts
}
