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
