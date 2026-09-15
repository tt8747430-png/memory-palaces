import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Identifiable } from './base-repository'

/** Where a pull stopped. `id` breaks ties between rows written in the same transaction. */
export interface Checkpoint {
  updated_at: string
  id: string
}

/**
 * One document that moved in the cloud, as the peek sees it: identity and clock, never content.
 * That is what keeps a peek cheap after a month offline — a thousand changed cards cost a thousand
 * ids, not a thousand documents.
 */
export interface RemoteChange {
  id: string
  updated_at: string
  deleted: boolean
}

export interface RemoteChangeEvent extends Checkpoint {
  table: SyncedTable
}

export const EPOCH = '1970-01-01T00:00:00Z'

/**
 * Whether a remote position is strictly past a checkpoint, under the same `(updated_at, id)`
 * ordering the pull filter uses. A null checkpoint means the device has never synced, so everything
 * is ahead of it.
 */
export function isAfterCheckpoint(at: Checkpoint, checkpoint: Checkpoint | null): boolean {
  if (!checkpoint) return true
  if (at.updated_at !== checkpoint.updated_at) return at.updated_at > checkpoint.updated_at
  return at.id > checkpoint.id
}

/**
 * The furthest position in a batch, or `fallback` when the batch is empty.
 *
 * Narrowed to the two columns a checkpoint is: a `RemoteChange` also carries `deleted`, and a
 * stored checkpoint that quietly grew a third field is a stored checkpoint that stops comparing
 * equal to the one the next version writes.
 */
export function highestCheckpoint(
  changes: readonly RemoteChange[],
  fallback: Checkpoint | null,
): Checkpoint | null {
  return changes.reduce<Checkpoint | null>(
    (highest, change) =>
      isAfterCheckpoint(change, highest)
        ? { updated_at: change.updated_at, id: change.id }
        : highest,
    fallback,
  )
}

/**
 * The parents a document hangs off, read from the cloud without its content. `deckId` for a card or
 * a question, `parentId` for a subdeck, `folderId` for a deck filed in a folder.
 */
export interface RemoteParents {
  id: string
  deckId?: string | null
  parentId?: string | null
  folderId?: string | null
}

/** Which rows a cycle's push carried, per table. What tells this device's own echo from news. */
export type PushedIds = Partial<Record<SyncedTable, readonly string[]>>

/**
 * A document as the cloud holds it: the row's `data`, with the replication's own tombstone flag
 * riding along. The flag is the cloud's, never the entity's — strip it before a document is
 * written back into a store.
 */
export type CloudDocument<T extends Identifiable = Identifiable> = T & { _deleted: boolean }

/**
 * Everything a Sync needs from the cloud, as one port.
 *
 * A port rather than a direct Supabase call, because `syncNow` is a feature command and a test has
 * to be able to run a whole cycle — peek, classify, apply, confirm — without a project. The
 * composition root supplies the Supabase adapter (`createSupabaseCloudSync`).
 */
export interface CloudSyncPort {
  /** What moved in `table` since `checkpoint`. Ids and clocks only, never `data`. */
  peek(table: SyncedTable, checkpoint: Checkpoint | null): Promise<RemoteChange[]>
  /**
   * Which containers `ids` hang off. Three scalar fields per row, never the document — enough to
   * tell whether an unseen child belongs to a deck or folder this device deleted.
   */
  parents(table: SyncedTable, ids: readonly string[]): Promise<RemoteParents[]>
  /**
   * The full documents behind `ids`, tombstones included. The one place a Sync reads content, and
   * only for the rows the user is actually being asked about.
   */
  fetch<T extends Identifiable>(
    table: SyncedTable,
    ids: readonly string[],
  ): Promise<CloudDocument<T>[]>
  /**
   * One apply-then-push pass. RxDB applies the pulls and runs the conflict handlers;
   * `push_documents` takes the writes. Rejects on the first replication error rather than retrying
   * forever, and resolves with the ids its push carried.
   */
  runCycle(): Promise<PushedIds>
}
