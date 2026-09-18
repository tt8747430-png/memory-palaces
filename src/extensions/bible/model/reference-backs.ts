import { parseRef } from './reference'
import { stripReference } from './strip-reference'

export interface CleanableCard {
  id: string
  front: string
  back: string
}

/** A back needs cleaning when its front is a reference and the back opens with one. */
export function cleanedBack(card: CleanableCard): string | null {
  if (!parseRef(card.front)) return null
  const cleaned = stripReference(card.back)
  return cleaned && cleaned !== card.back ? cleaned : null
}

export function countReferenceBacks(cards: readonly CleanableCard[]): number {
  return cards.filter((card) => cleanedBack(card) !== null).length
}
