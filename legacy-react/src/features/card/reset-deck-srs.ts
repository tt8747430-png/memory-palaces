import { selectDecks, type DeckStore } from '@/entities/deck'
import { selectCards, type CardStore } from '@/entities/card'
import { cardsInSubtree } from '@/shared/lib'
import { resetCardsSrs } from './reset-cards-srs'

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
