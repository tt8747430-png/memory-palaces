import { selectDecks, type DeckStore } from '@/entities/deck'
import { selectCards, type CardStore } from '@/entities/card'
import { cardsInSubtree } from '@/shared/lib'
import { markCardsKnown } from './mark-cards-known'

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
