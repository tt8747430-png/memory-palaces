import type { DeckStore } from '@app/decks/data/stores'
import type { CardStore } from '@app/decks/data/stores'
import { cardsInSubtree } from '@app/shared/domain'
import { resetCardsSrs } from './reset-cards-srs'

export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  const ids = cardsInSubtree(deckStore.decks(), cardStore.cards(), deckId).map((card) => card.id)
  await resetCardsSrs(cardStore, ids)
}
