import { selectDecks, type DeckStore } from '@/entities/deck'
import { selectCards, type CardStore } from '@/entities/card'
import { cardsInSubtree } from '@/shared/lib'
import { resetCardsSrs } from './reset-cards-srs'

/**
 * Command — clear the spaced-repetition schedule for every card in a deck's whole subtree,
 * returning it all to "new" while keeping the content. Backs the deck-settings "Reset progress"
 * action (a deck's identity spans its subtree; ADR-0003).
 */
export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  const ids = cardsInSubtree(
    selectDecks(deckStore.getState()),
    selectCards(cardStore.getState()),
    deckId,
  ).map((card) => card.id)
  await resetCardsSrs(cardStore, ids)
}
