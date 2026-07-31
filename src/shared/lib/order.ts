import type { Identifiable } from '@/shared/api'

export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

/**
 * The three orderings a collection store can hold rows in. Every slice picks one instead of
 * spelling out its own comparator, so "manual order" and "newest first" mean one thing everywhere.
 */
type Ordered = { order: number; createdAt: string }
type Created = { createdAt: string }

/** Manual order, with creation time breaking ties on equal `order`. */
export const byOrderThenCreated = (a: Ordered, b: Ordered): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export const byNewestFirst = (a: Created, b: Created): number =>
  b.createdAt.localeCompare(a.createdAt)

export const byOldestFirst = (a: Created, b: Created): number =>
  a.createdAt.localeCompare(b.createdAt)

/**
 * Writes `orderedIds` back onto `items` as consecutive orders, calling `write` only for rows whose
 * order moved. Ids the list no longer holds are skipped, so a stale drag cannot resurrect a
 * deleted row.
 */
export async function reorderById<T extends Identifiable & { order: number }>(
  items: ReadonlyArray<T>,
  orderedIds: ReadonlyArray<string>,
  write: (item: T, order: number) => Promise<unknown>,
): Promise<void> {
  const byId = new Map(items.map((item) => [item.id, item]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const item = byId.get(id)
      return !item || item.order === index ? undefined : write(item, index)
    }),
  )
}
