import type { ExtensionId } from '@/shared/lib'

export const SYNCED_TABLES = [
  'decks',
  'cards',
  'folders',
  'questions',
  'progress',
  'preferences',
  'profiles',
  'history',
] as const

/** The core tables, closed — `SYNCED_TABLES` is still exactly these. */
type CoreSyncedTable = (typeof SYNCED_TABLES)[number]

/**
 * A table replication may carry, core or contributed. Open, because an extension's table name is
 * not knowable at compile time; `(string & {})` keeps autocomplete for the core names.
 *
 * Nothing switches exhaustively on this — every consumer either keys a map by it
 * (`SyncState['checkpoints']`, `PushedIds`, `Peek`) or takes it as a parameter (`peek`, `parents`,
 * `createCloudWatcher`) — so widening it costs no exhaustiveness check. Check that again before
 * adding a `switch` over a table name; the answer then is a map, not a union.
 */
export type SyncedTable = CoreSyncedTable | (string & {})

export interface SyncTableSpec {
  table: SyncedTable
  /** The RxDB collection key, which is not the table name for an extension's collection. */
  collectionKey: string
  /** The extension that owns it; null for a core table, which always replicates. */
  owner: ExtensionId | null
}

export const CORE_SYNC_TABLES: readonly SyncTableSpec[] = SYNCED_TABLES.map((table) => ({
  table,
  collectionKey: table,
  owner: null,
}))

/**
 * The tables a cycle covers right now: every core one, plus the contributed ones whose extension
 * is enabled. The watcher, the replication cycle and the peek all read this one derivation, so
 * they cannot disagree about which tables are live — a table the peek asks about but the cycle
 * never pulls is a banner no Synchronise can clear.
 *
 * Takes a predicate rather than the stored ids: what "enabled" means belongs to the preferences
 * entity, and `shared` may not reach it.
 */
export function activeSyncTables(
  specs: readonly SyncTableSpec[],
  isEnabled: (id: ExtensionId) => boolean,
): readonly SyncedTable[] {
  return specs.flatMap((spec) => (spec.owner === null || isEnabled(spec.owner) ? [spec.table] : []))
}

export const CONTENT_COLLECTIONS = ['folders', 'decks', 'cards', 'questions'] as const

export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

export const CONTAINER_COLLECTIONS: readonly ContentCollection[] = ['decks', 'folders']

const CONTENT: ReadonlySet<string> = new Set(CONTENT_COLLECTIONS)

/** The four collections a learner's content lives in — the ones a deletion can diverge on. */
export function isContentCollection(table: SyncedTable): table is ContentCollection {
  return CONTENT.has(table)
}

/** How a Pending change names its document: `cards:c1`. One document, one entry. */
export const pendingKey = (table: SyncedTable, id: string): string => `${table}:${id}`
