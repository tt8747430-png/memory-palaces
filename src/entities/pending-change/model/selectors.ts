import { CONTENT_COLLECTIONS, type ContentCollection } from '@/shared/config/sync-tables'
import type { PendingChange } from './types'
import type { PendingChangeState } from './store'

export const selectPendingChanges = (state: PendingChangeState): PendingChange[] =>
  state.pendingChanges

export const selectPendingCount = (state: PendingChangeState): number => state.pendingChanges.length

export const selectLatestPendingAt = (state: PendingChangeState): string | null =>
  state.pendingChanges.reduce<string | null>(
    (latest, change) => (latest === null || change.at > latest ? change.at : latest),
    null,
  )

export function pendingByCollection(
  changes: readonly PendingChange[],
): Record<ContentCollection, number> {
  const counts = Object.fromEntries(
    CONTENT_COLLECTIONS.map((collection) => [collection, 0]),
  ) as Record<ContentCollection, number>
  for (const change of changes) counts[change.contentCollection] += 1
  return counts
}
