import type { Identifiable } from '@/shared/api'

export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

/**
 * Writes `orderedIds` back onto `items` as consecutive orders, calling `write`
 * only for the ones whose order actually moved. Ids the list no longer holds
 * are skipped, so a stale drag cannot resurrect a deleted row.
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
