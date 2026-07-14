export function nextOrder(items: readonly { order: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

export function resequence<T extends { order: number }>(
  ordered: readonly T[],
): { item: T; order: number }[] {
  const changes: { item: T; order: number }[] = []
  ordered.forEach((item, index) => {
    if (item.order !== index) changes.push({ item, order: index })
  })
  return changes
}
