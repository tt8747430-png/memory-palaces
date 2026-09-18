import type { SyncedTable } from '@/shared/config/sync-tables'
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

/**
 * The changes a Sync over `tables` would carry. A disabled extension's rows wait in the log
 * without being anyone's business until it is switched back on.
 */
export const pendingIn = (
  changes: readonly PendingChange[],
  tables: readonly SyncedTable[],
): PendingChange[] => {
  const live = new Set(tables)
  return changes.filter((change) => live.has(change.table))
}

/** How many changes wait per table, in first-seen order; a table with none is absent. */
export function pendingByTable(
  changes: readonly PendingChange[],
): Partial<Record<SyncedTable, number>> {
  const counts: Partial<Record<SyncedTable, number>> = {}
  for (const change of changes) counts[change.table] = (counts[change.table] ?? 0) + 1
  return counts
}
