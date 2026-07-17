import type { DeckStore } from '@app/decks/data/stores'
import type { CardStore } from '@app/decks/data/stores'
import { cardsInSubtree } from '@app/shared/domain'
import { markCardsKnown } from './mark-cards-known'

export async function markDeckKnown(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  const ids = cardsInSubtree(deckStore.decks(), cardStore.cards(), deckId).map((card) => card.id)
  await markCardsKnown(cardStore, ids)
}
