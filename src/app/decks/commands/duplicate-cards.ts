import type { CardStore } from '@app/decks/data/stores'
import { duplicateCard } from './duplicate-card'

/**
 * Duplicate a selection of cards.
 *
 * Sequential: `duplicateCard` reads the current card list to place its copy, so
 * duplicating several at once must not interleave.
 */
export async function duplicateCards(store: CardStore, ids: readonly string[]): Promise<void> {
  for (const id of ids) await duplicateCard(store, id)
}
