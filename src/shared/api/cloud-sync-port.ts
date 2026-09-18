import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Identifiable } from './base-repository'

export interface Checkpoint {
  updated_at: string
  id: string
}

export interface RemoteChange {
  id: string
  updated_at: string
  deleted: boolean
}

export interface RemoteChangeEvent extends Checkpoint {
  table: SyncedTable
}

/** What the cloud watcher reports: a row that moved, and a channel that came back. */
export interface RemoteChangeHandlers {
  onChange: (event: RemoteChangeEvent) => void
  /**
   * The Realtime channel subscribed again after a drop. Events may have gone by unheard, so the
   * cloud may have moved without a single `onChange` saying so.
   */
  onReconnect: () => void
}

export const NO_REMOTE_CHANGE_HANDLERS: RemoteChangeHandlers = {
  onChange: () => {},
  onReconnect: () => {},
}

export const EPOCH = '1970-01-01T00:00:00Z'

export function isAfterCheckpoint(at: Checkpoint, checkpoint: Checkpoint | null): boolean {
  if (!checkpoint) return true
  if (at.updated_at !== checkpoint.updated_at) return at.updated_at > checkpoint.updated_at
  return at.id > checkpoint.id
}

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

export interface RemoteParents {
  id: string
  deckId?: string | null
  parentId?: string | null
  folderId?: string | null
}

export type PushedIds = Partial<Record<SyncedTable, readonly string[]>>

export type CloudDocument<T extends Identifiable = Identifiable> = T & { _deleted: boolean }

export interface CloudSyncPort {
  peek(table: SyncedTable, checkpoint: Checkpoint | null): Promise<RemoteChange[]>
  parents(table: SyncedTable, ids: readonly string[]): Promise<RemoteParents[]>
  fetch<T extends Identifiable>(
    table: SyncedTable,
    ids: readonly string[],
  ): Promise<CloudDocument<T>[]>
  runCycle(): Promise<PushedIds>
  /**
   * The next cycle reads every cloud document again from the first, not from the checkpoint. What
   * each local document was based on is kept, so a change waiting here still merges against it.
   */
  rereadEverything(): Promise<void>
}
