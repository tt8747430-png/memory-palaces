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
  contentKey,
  SYNCED_TABLES,
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

/** What every synced table moved since the checkpoints it was asked from. */
export type Peek = ReadonlyMap<SyncedTable, readonly RemoteChange[]>

/** The descendant tables a container's subtree can reach. Folders hold decks, not folders. */
const CHILD_COLLECTIONS: readonly ContentCollection[] = CONTENT_COLLECTIONS.filter(
  (collection) => collection !== 'folders',
)

/** Every table at once — the peeks are independent, and a Sync is only as fast as its slowest. */
export async function peekAll(deps: SyncDeps, checkpoints: Checkpoints): Promise<Peek> {
  const found = await Promise.all(
    SYNCED_TABLES.map((table) => deps.cloud.peek(table, checkpoints[table] ?? null)),
  )
  return new Map(SYNCED_TABLES.map((table, index) => [table, found[index] ?? []]))
}

export const peekedCount = (peek: Peek): number =>
  [...peek.values()].reduce((total, changes) => total + changes.length, 0)

/** The checkpoints after everything `peek` saw — the highest `(updated_at, id)` per table. */
export function advance(checkpoints: Checkpoints, peek: Peek): Checkpoints {
  const next: Checkpoints = { ...checkpoints }
  for (const [table, changes] of peek) {
    next[table] = highestCheckpoint(changes, checkpoints[table] ?? null)
  }
  return next
}

/**
 * Steps each table's checkpoint over the rows this device's own push just wrote, and no further.
 *
 * The push stamps every row it writes with a fresh server clock, so without this the next peek —
 * and the Realtime echo of the push — would report this device's own work as the cloud having
 * moved, and the banner would light up after every Sync. So after the cycle the table is peeked
 * again from where the first peek stopped, and the checkpoint walks forward through rows the push
 * carried. It stops at the first row it did *not* push: that one is another device's, was never
 * classified, and the next Sync has to see it. `foreignAhead` is whether any table stopped short.
 */
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

/**
 * The documents under the deleted containers in `roots`, as the cloud knows them.
 *
 * Reads parents only — three scalars per row — for the candidate ids, which is what keeps the
 * classifier from pulling a month's worth of card content to answer "whose child is this".
 */
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

/**
 * The documents the user has to be asked about.
 *
 * **Rule one** — a document deleted here that the cloud went on editing. A document deleted on both
 * sides is not a question.
 *
 * **Rule two** — a deck or folder deleted here, under which another device added or edited
 * documents this device has never seen. The question is about the container the person deleted,
 * not about children they never saw; those ride along as its `descendants`. Every child that *was*
 * on the device went with the container when it was deleted (`deleteDeck` takes subdecks, cards and
 * questions), so a remote edit to one of those is already a rule-one question of its own.
 *
 * `answered` suppresses documents the person has already decided about in this Sync, so resolving
 * the dialog cannot reopen it for the same rows.
 */
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
      const key = contentKey(collection, change.id)
      if (answered.has(key)) continue
      if (classifyChange(byKey.get(key), change) === 'destructive') {
        items.set(key, { collection, id: change.id })
      }
    }
  }

  const containers = pending.filter(
    (change) =>
      change.op === 'remove' &&
      CONTAINER_COLLECTIONS.includes(change.collection) &&
      !answered.has(change.id),
  )
  if (!containers.length) return [...items.values()]

  const unseen = new Map(
    CHILD_COLLECTIONS.map((collection) => {
      const here = localIds(deps, collection)
      const ids = (peek.get(collection) ?? [])
        .filter((change) => !change.deleted)
        .filter((change) => !byKey.has(contentKey(collection, change.id)))
        .filter((change) => !here.has(change.id))
        .map((change) => change.id)
      return [collection, ids] as const
    }),
  )

  const containerOf = new Map(containers.map((change) => [change.entityId, change.collection]))
  const found = await cloudDescendants(deps, [...containerOf.keys()], unseen)
  for (const descendant of found.values()) {
    const collection = containerOf.get(descendant.root)
    if (!collection) continue
    const key = contentKey(collection, descendant.root)
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
