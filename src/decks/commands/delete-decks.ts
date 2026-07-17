import { subtreeDeckIds } from '@/shared/domain'
import type { CardStore, DeckStore } from '@/decks/data/stores'

/**
 * Delete a selection of decks, each with its whole subtree and every card in it.
 *
 * The subtrees are unioned before removing, so selecting both a parent and its
 * child does not try to remove the child twice.
 */
export async function deleteDecks(
  deckStore: DeckStore,
  cardStore: CardStore,
  ids: readonly string[],
): Promise<void> {
  const decks = deckStore.decks()
  const targets = new Set<string>()
  for (const id of ids) for (const subId of subtreeDeckIds(decks, id)) targets.add(subId)
  const cards = cardStore.cards().filter((card) => targets.has(card.deckId))
  await Promise.all(cards.map((card) => cardStore.remove(card.id)))
  await Promise.all([...targets].map((deckId) => deckStore.remove(deckId)))
}
