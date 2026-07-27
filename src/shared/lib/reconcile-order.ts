export function reconcileHeldOrder(
  pendingIds: readonly string[],
  itemIds: readonly string[],
): { order: string[]; settled: boolean } {
  const present = new Set(itemIds)
  const pendingSet = new Set(pendingIds)
  const order = [
    ...pendingIds.filter((id) => present.has(id)),
    ...itemIds.filter((id) => !pendingSet.has(id)),
  ]
  const settled = itemIds.length === order.length && itemIds.every((id, i) => id === order[i])
  return { order, settled }
}
