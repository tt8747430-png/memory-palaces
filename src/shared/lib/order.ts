/**
 * Helpers for the explicit `order` field carried by reorderable items (cards, questions).
 * Pure and entity-agnostic — they operate on the minimal `{ order }` shape.
 */

/** Next position for an appended item: one past the highest existing order (0 for an
 * empty list). Tolerates equal/legacy orders. */
export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

/**
 * Reassign sequential orders (0..n-1) to a list already arranged in its desired sequence,
 * returning only the items whose order actually changed (each with its new order). Lets a
 * reorder persist the minimum set of documents and normalises any legacy equal orders.
 */
export function resequence<T extends { order: number }>(
  ordered: ReadonlyArray<T>,
): Array<{ item: T; order: number }> {
  const changes: Array<{ item: T; order: number }> = []
  ordered.forEach((item, index) => {
    if (item.order !== index) changes.push({ item, order: index })
  })
  return changes
}
