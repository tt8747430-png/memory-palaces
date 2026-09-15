import type { Identifiable } from '@/shared/api'

export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

type Ordered = { order: number; createdAt: string }
type Created = { createdAt: string }

export const byOrderThenCreated = (a: Ordered, b: Ordered): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

export const byNewestFirst = (a: Created, b: Created): number =>
  b.createdAt.localeCompare(a.createdAt)

export const byOldestFirst = (a: Created, b: Created): number =>
  a.createdAt.localeCompare(b.createdAt)

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
