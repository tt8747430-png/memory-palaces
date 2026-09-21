import type { SyncedTable } from '@/shared/config/sync-tables'
import type { PendingChange } from './types'
import type { PendingChangeState } from './store'

export const selectPendingChanges = (state: PendingChangeState): PendingChange[] =>
  state.pendingChanges
export const selectPendingCount = (state: PendingChangeState): number => state.pendingChanges.length
const latestAt = (changes: readonly PendingChange[]): string | null =>
  changes.reduce<string | null>(
    (latest, change) => (latest === null || change.at > latest ? change.at : latest),
    null,
  )

export const selectLatestPendingAt = (state: PendingChangeState): string | null =>
  latestAt(state.pendingChanges)

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

/** How many changes a Sync over `tables` would carry — for a subscriber that shows only the count. */
export const selectPendingCountIn =
  (tables: readonly SyncedTable[]) =>
  (state: PendingChangeState): number =>
    pendingIn(state.pendingChanges, tables).length

/**
 * When the newest change on `tables` was written — the key a cadence's debounce follows, so a
 * graded card cannot restart the wait a changed setting is in, or the reverse.
 */
export const selectLatestPendingAtIn =
  (tables: readonly SyncedTable[]) =>
  (state: PendingChangeState): string | null =>
    latestAt(pendingIn(state.pendingChanges, tables))

/** How many changes wait per table, in first-seen order; a table with none is absent. */
export function pendingByTable(
  changes: readonly PendingChange[],
): Partial<Record<SyncedTable, number>> {
  const counts: Partial<Record<SyncedTable, number>> = {}
  for (const change of changes) counts[change.table] = (counts[change.table] ?? 0) + 1
  return counts
}
