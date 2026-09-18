import { type CleanableCard, cleanedBack } from '../model/reference-backs'

/**
 * Rewrites the backs through `save`, which the caller wires to the core card command so the
 * edit syncs and logs a pending change like any other.
 */
export async function cleanReferenceBacks(
  cards: readonly CleanableCard[],
  save: (id: string, back: string) => Promise<void>,
): Promise<number> {
  let changed = 0
  for (const card of cards) {
    const back = cleanedBack(card)
    if (!back) continue
    await save(card.id, back)
    changed += 1
  }
  return changed
}
