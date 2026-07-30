import { type DeckStore, selectDecks } from '@/entities/deck'
import { type CardStore, selectCards } from '@/entities/card'
import { subtreeDeckIds } from '@/shared/lib'

export async function deleteDeck(
  deckStore: DeckStore,
  cardStore: CardStore,
  id: string,
): Promise<void> {
  const deckIds = subtreeDeckIds(selectDecks(deckStore.getState()), id)
  const idSet = new Set(deckIds)
  const cards = selectCards(cardStore.getState()).filter((card) => idSet.has(card.deckId))
  await Promise.all(cards.map((card) => cardStore.getState().remove(card.id)))
  await Promise.all(deckIds.map((deckId) => deckStore.getState().remove(deckId)))
}
