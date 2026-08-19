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
  // Never last: a card the learner is still learning must come round again, so on a queue shorter
  // than the gap it lands as early as it must to keep something behind it. Only an empty queue
  // leaves it alone at the end, and then it is the whole queue.
  const at = rest.length === 0 ? 0 : Math.min(ahead, rest.length - 1)
  return [...rest.slice(0, at), id, ...rest.slice(at)]
}
