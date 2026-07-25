/**
 * Reconciles a held (just-dropped) order against a store's latest row ids.
 *
 * A manual reorder persists as one write per row, so the store re-emits *partial* orders on the
 * way to the final one. A local working-copy list that follows every emission renders those
 * partials — and a multi-row drop settles row-by-row (4 → 3 → 2 → 1) instead of all at once,
 * the drop flicker §10 of `docs/CODE_STYLE.md` warns about. This keeps the committed order for
 * rows that still exist, slots any newly-arrived rows after them, and reports `settled` once the
 * store's own order already matches — the signal to stop holding.
 *
 * The entity stores use `useOptimisticPatch` for the same guarantee; this is its equivalent for
 * a component that owns a local ordered copy synced from props (`ReorderableList`).
 */
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
