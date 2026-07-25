/**
 * Where a dragged block of rows lands when it is dropped onto `overId`.
 *
 * A multi-select drag carries several rows at once, and they must land *contiguously* — the
 * selection is one thing in the user's hand, so it has to be one thing when it comes down. The
 * block goes after the target when the drag came from above it and before the target when it
 * came from below, which is the rule dnd-kit's own single-row move follows, generalised: the row
 * you are pointing at keeps the side of the block it was already on.
 *
 * Carried rows keep their relative order. Dropping onto a row that is itself carried, or onto a
 * row that isn't in `order`, is a no-op — there is no gap to land in.
 */
export function moveBlock(
  order: readonly string[],
  carried: ReadonlySet<string>,
  overId: string,
): string[] {
  if (carried.has(overId) || !order.includes(overId)) return [...order]

  const block = order.filter((id) => carried.has(id))
  if (block.length === 0) return [...order]

  const rest = order.filter((id) => !carried.has(id))
  const overIndex = order.indexOf(overId)
  const firstCarried = order.findIndex((id) => carried.has(id))
  const at = rest.indexOf(overId) + (overIndex > firstCarried ? 1 : 0)

  return [...rest.slice(0, at), ...block, ...rest.slice(at)]
}
