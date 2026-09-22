import type { Identifiable } from '@/shared/api'

export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

/**
 * How names sort: `Geneza 2` before `Geneza 10`, case and accents set aside. One collator for the
 * whole app, so a deck, a card and a folder never disagree about what comes first.
 */
const natural = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const compareNatural = (a: string, b: string): number => natural.compare(a, b)

type Ordered = { order: number; createdAt: string }
type Created = { createdAt: string }

export const byOrderThenCreated = (a: Ordered, b: Ordered): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export const byNewestFirst = (a: Created, b: Created): number =>
  b.createdAt.localeCompare(a.createdAt)

export const byOldestFirst = (a: Created, b: Created): number =>
  a.createdAt.localeCompare(b.createdAt)

/**
 * A drag that happened on a filtered list, written back over the whole one. The rows that were on
 * screen take the order the finger gave them; a row the filter hid keeps the slot it already had,
 * because nothing the learner could see said anything about it.
 *
 * Without this, reordering three of eight decks numbers those three 0-2 and leaves the other five
 * on their old numbers — every hidden row interleaved somewhere it was never put.
 */
export function mergeVisibleOrder(
  all: readonly string[],
  visibleOrder: readonly string[],
): string[] {
  const held = new Set(all)
  // An id the list does not hold is not a slot to fill: it would be written into the order.
  const moved = visibleOrder.filter((id) => held.has(id))
  const moving = new Set(moved)
  let next = 0
  return all.map((id) => (moving.has(id) ? (moved[next++] ?? id) : id))
}

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
