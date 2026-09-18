import {
  type Checkpoint,
  highestCheckpoint,
  isAfterCheckpoint,
  type PushedIds,
  type RemoteChange,
} from '@/shared/api'
import {
  CONTAINER_COLLECTIONS,
  CONTENT_COLLECTIONS,
  type ContentCollection,
  isContentCollection,
  pendingKey,
  type SyncedTable,
} from '@/shared/config/sync-tables'
import {
  classifyChange,
  descendantsOf,
  type Parented,
  type SyncDocumentRef,
  type SyncReviewItem,
} from '@/shared/lib'
import type { PendingChange } from '@/entities/pending-change'
import type { SyncState } from '@/entities/sync-state'
import { localIds } from './content-collections'
import type { SyncDeps } from './sync-deps'

type Checkpoints = SyncState['checkpoints']

export type Peek = ReadonlyMap<SyncedTable, readonly RemoteChange[]>

const CHILD_COLLECTIONS: readonly ContentCollection[] = CONTENT_COLLECTIONS.filter(
  (collection) => collection !== 'folders',
)

export async function peekAll(deps: SyncDeps, checkpoints: Checkpoints): Promise<Peek> {
  const found = await Promise.all(
    deps.tables.map((table) => deps.cloud.peek(table, checkpoints[table] ?? null)),
  )
  return new Map(deps.tables.map((table, index) => [table, found[index] ?? []]))
}

export const peekedCount = (peek: Peek): number =>
  [...peek.values()].reduce((total, changes) => total + changes.length, 0)

export function advance(checkpoints: Checkpoints, peek: Peek): Checkpoints {
  const next: Checkpoints = { ...checkpoints }
  for (const [table, changes] of peek) {
    next[table] = highestCheckpoint(changes, checkpoints[table] ?? null)
  }
  return next
}

export function stepOverOwnEcho(
  checkpoints: Checkpoints,
  settled: Peek,
  pushed: PushedIds,
): { checkpoints: Checkpoints; foreignAhead: boolean } {
  const next: Checkpoints = { ...checkpoints }
  let foreignAhead = false
  for (const [table, changes] of settled) {
    const own = new Set(pushed[table] ?? [])
    let at: Checkpoint | null = checkpoints[table] ?? null
    for (const change of changes) {
      if (!own.has(change.id)) {
        foreignAhead = true
        break
      }
      if (isAfterCheckpoint(change, at)) at = { updated_at: change.updated_at, id: change.id }
    }
    next[table] = at
  }
  return { checkpoints: next, foreignAhead }
}

export async function cloudDescendants(
  deps: SyncDeps,
  roots: readonly string[],
  candidates: ReadonlyMap<ContentCollection, readonly string[]>,
): Promise<Map<string, SyncDocumentRef & { root: string }>> {
  if (!roots.length) return new Map()
  const lookups = await Promise.all(
    CHILD_COLLECTIONS.map(async (collection) => {
      const ids = candidates.get(collection) ?? []
      const parents = ids.length ? await deps.cloud.parents(collection, ids) : []
      return parents.map((row) => ({ ...row, collection }))
    }),
  )
  const rows: (Parented & { collection: ContentCollection })[] = lookups.flat()
  const collectionOf = new Map(rows.map((row) => [row.id, row.collection]))
  const found = new Map<string, SyncDocumentRef & { root: string }>()
  for (const [id, root] of descendantsOf(roots, rows)) {
    const collection = collectionOf.get(id)
    if (collection) found.set(id, { collection, id, root })
  }
  return found
}

export async function findDestructive(
  deps: SyncDeps,
  peek: Peek,
  pending: readonly PendingChange[],
  answered: ReadonlySet<string> = new Set(),
): Promise<SyncReviewItem[]> {
  const byKey = new Map(pending.map((change) => [change.id, change]))
  const items = new Map<string, SyncReviewItem>()

  for (const collection of CONTENT_COLLECTIONS) {
    for (const change of peek.get(collection) ?? []) {
      const key = pendingKey(collection, change.id)
      if (answered.has(key)) continue
      if (classifyChange(byKey.get(key), change) === 'destructive') {
        items.set(key, { collection, id: change.id })
      }
    }
  }

  const containers = pending.filter(
    (change) =>
      change.op === 'remove' &&
      isContentCollection(change.table) &&
      CONTAINER_COLLECTIONS.includes(change.table) &&
      !answered.has(change.id),
  )
  if (!containers.length) return [...items.values()]

  const unseen = new Map(
    CHILD_COLLECTIONS.map((collection) => {
      const here = localIds(deps, collection)
      const ids = (peek.get(collection) ?? [])
        .filter((change) => !change.deleted)
        .filter((change) => !byKey.has(pendingKey(collection, change.id)))
        .filter((change) => !here.has(change.id))
        .map((change) => change.id)
      return [collection, ids] as const
    }),
  )

  const containerOf = new Map<string, ContentCollection>()
  for (const change of containers) {
    if (isContentCollection(change.table)) containerOf.set(change.entityId, change.table)
  }
  const found = await cloudDescendants(deps, [...containerOf.keys()], unseen)
  for (const descendant of found.values()) {
    const collection = containerOf.get(descendant.root)
    if (!collection) continue
    const key = pendingKey(collection, descendant.root)
    const item = items.get(key) ?? { collection, id: descendant.root }
    items.set(key, {
      ...item,
      descendants: [
        ...(item.descendants ?? []),
        { collection: descendant.collection, id: descendant.id },
      ],
    })
  }

  return [...items.values()]
}
