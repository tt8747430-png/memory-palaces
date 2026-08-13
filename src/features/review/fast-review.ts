/**
 * How far ahead a "Not quite" card is put back. Fast review has no schedule, so "still learning"
 * has to mean something inside the session: the card returns soon, and keeps returning, until the
 * learner says they have it.
 */
export const REINSERT_AHEAD = 4

export function reinsertAhead(
  rest: string[],
  id: string,
  ahead: number = REINSERT_AHEAD,
): string[] {
  const at = Math.min(ahead, rest.length)
  return [...rest.slice(0, at), id, ...rest.slice(at)]
}
