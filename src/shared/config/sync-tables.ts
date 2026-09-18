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
export type CoreSyncedTable = (typeof SYNCED_TABLES)[number]

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
}

export const CORE_SYNC_TABLES: readonly SyncTableSpec[] = SYNCED_TABLES.map((table) => ({
  table,
  collectionKey: table,
}))

export const CONTENT_COLLECTIONS = ['folders', 'decks', 'cards', 'questions'] as const

export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

export const CONTAINER_COLLECTIONS: readonly ContentCollection[] = ['decks', 'folders']

export const contentKey = (collection: ContentCollection, id: string): string =>
  `${collection}:${id}`
