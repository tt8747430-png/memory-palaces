import { parseRef } from '../model/reference'
import { stripReference } from '../model/strip-reference'

export interface CleanableCard {
  id: string
  front: string
  back: string
}

/** A back needs cleaning when its front is a reference and the back opens with one. */
function cleanedBack(card: CleanableCard): string | null {
  if (!parseRef(card.front)) return null
  const cleaned = stripReference(card.back)
  return cleaned && cleaned !== card.back ? cleaned : null
}

export function countReferenceBacks(cards: readonly CleanableCard[]): number {
  return cards.filter((card) => cleanedBack(card) !== null).length
}

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
