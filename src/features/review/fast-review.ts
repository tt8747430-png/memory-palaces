export const REINSERT_AHEAD = 4

export function reinsertAhead(
  rest: string[],
  id: string,
  ahead: number = REINSERT_AHEAD,
): string[] {
  const at = rest.length === 0 ? 0 : Math.min(ahead, rest.length - 1)
  return [...rest.slice(0, at), id, ...rest.slice(at)]
}
