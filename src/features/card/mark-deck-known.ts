import { selectDecks, type DeckStore } from '@/entities/deck'
import { selectCards, type CardStore } from '@/entities/card'
import { cardsInSubtree } from '@/shared/lib'
import { markCardsKnown } from './mark-cards-known'

/**
 * Command — force every card in a deck's whole subtree into a "known" (mastered) schedule.
 * Backs the deck's "Mark all as known" action ("I already know these").
 */
export async function markDeckKnown(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  const ids = cardsInSubtree(
    selectDecks(deckStore.getState()),
    selectCards(cardStore.getState()),
    deckId,
  ).map((card) => card.id)
  await markCardsKnown(cardStore, ids)
}
