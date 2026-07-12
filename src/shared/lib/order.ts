
export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

export function resequence<T extends { order: number }>(
  ordered: ReadonlyArray<T>,
): Array<{ item: T; order: number }> {
  const changes: Array<{ item: T; order: number }> = []
  ordered.forEach((item, index) => {
    if (item.order !== index) changes.push({ item, order: index })
  })
  return changes
}
