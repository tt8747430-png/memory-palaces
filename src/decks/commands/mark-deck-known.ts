import type { DeckStore } from '@/decks/data/stores'
import type { CardStore } from '@/decks/data/stores'
import { cardsInSubtree } from '@/shared/domain'
import { markCardsKnown } from './mark-cards-known'

export async function markDeckKnown(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  const ids = cardsInSubtree(deckStore.decks(), cardStore.cards(), deckId).map((card) => card.id)
  await markCardsKnown(cardStore, ids)
}
