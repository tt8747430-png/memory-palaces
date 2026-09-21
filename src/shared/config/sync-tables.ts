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

/**
 * How a table's changes leave the device.
 *
 * - `held` — they wait to be asked. Synchronise sends them; Autosync asks on the learner's behalf.
 * - `quiet` — they go on their own as soon as they can, and are never reported as waiting.
 *
 * The split is the learner's, not the schema's: what they would call their work is held, and the
 * furniture around it — how the app looks, which rows are open, who they are — is quiet.
 */
export type SyncCadence = 'held' | 'quiet'

export interface SyncTableSpec {
  table: SyncedTable
  /** The RxDB collection key, which is not the table name for an extension's collection. */
  collectionKey: string
  /** The extension that owns it; null for a core table, which always replicates. */
  owner: ExtensionId | null
  cadence: SyncCadence
  /**
   * The key naming the table to a learner, in the owner's namespace (`bible:versesTable`). A core
   * table is named by the app (`sync.tables.<table>`), so it carries none.
   */
  labelKey?: string
}

const CORE: ReadonlySet<string> = new Set(SYNCED_TABLES)

/** A table the app itself declares — named by `sync.tables.<table>`, not by an extension's key. */
export function isCoreSyncedTable(table: SyncedTable): table is CoreSyncedTable {
  return CORE.has(table)
}

/** The core tables whose changes never wait to be asked. Everything else a learner made is held. */
const QUIET_CORE: ReadonlySet<CoreSyncedTable> = new Set<CoreSyncedTable>([
  'preferences',
  'profiles',
])

export const CORE_SYNC_TABLES: readonly SyncTableSpec[] = SYNCED_TABLES.map((table) => ({
  table,
  collectionKey: table,
  owner: null,
  cadence: QUIET_CORE.has(table) ? 'quiet' : 'held',
}))

/**
 * The tables live right now: every core one, plus the contributed ones whose extension is enabled.
 * With a `cadence` it narrows to that half. The watcher, both cycles and the peek all read this one
 * derivation, so they cannot disagree about which tables are live — a table the peek asks about but
 * no cycle pulls is a banner no Synchronise can clear.
 *
 * Takes a predicate rather than the stored ids: what "enabled" means belongs to the preferences
 * entity, and `shared` may not reach it.
 */
export function activeSyncTables(
  specs: readonly SyncTableSpec[],
  isEnabled: (id: ExtensionId) => boolean,
  cadence?: SyncCadence,
): readonly SyncedTable[] {
  return specs.flatMap((spec) =>
    (spec.owner === null || isEnabled(spec.owner)) &&
    (cadence === undefined || spec.cadence === cadence)
      ? [spec.table]
      : [],
  )
}

/** The core tables of each cadence, for a build with no extension on — and for tests. */
export const CORE_HELD_TABLES: readonly SyncedTable[] = activeSyncTables(
  CORE_SYNC_TABLES,
  () => true,
  'held',
)
export const CORE_QUIET_TABLES: readonly SyncedTable[] = activeSyncTables(
  CORE_SYNC_TABLES,
  () => true,
  'quiet',
)

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
