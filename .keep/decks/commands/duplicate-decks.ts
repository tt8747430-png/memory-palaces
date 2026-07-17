import type { CardStore, DeckStore } from '@app/decks/data/stores'
import { duplicateDeck } from './duplicate-deck'

/**
 * Duplicate a selection of decks, each with its subtree and cards.
 *
 * Sequential: `duplicateDeck` reads the current deck list to resolve each
 * subtree, so overlapping copies must not interleave.
 */
export async function duplicateDecks(
  deckStore: DeckStore,
  cardStore: CardStore,
  ids: readonly string[],
): Promise<void> {
  for (const id of ids) await duplicateDeck(deckStore, cardStore, id)
}
