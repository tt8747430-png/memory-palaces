import type { DeckStore } from '@app/decks/data/stores'
import type { CardStore } from '@app/decks/data/stores'
import { subtreeDeckIds } from '@app/shared/domain'

export async function deleteDeck(
  deckStore: DeckStore,
  cardStore: CardStore,
  id: string,
): Promise<void> {
  const deckIds = subtreeDeckIds(deckStore.decks(), id)
  const idSet = new Set(deckIds)
  const cards = cardStore.cards().filter((card) => idSet.has(card.deckId))
  await Promise.all(cards.map((card) => cardStore.remove(card.id)))
  await Promise.all(deckIds.map((deckId) => deckStore.remove(deckId)))
}
