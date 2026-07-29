import { cardsForDeck, type Card, type CardStore, makeCard, selectCards } from '@/entities/card'
import { nextOrder, type ParsedCard } from '@/shared/lib'

/** A card as it arrives from a form, a paste or an import file. */
export type CreateCardInput = ParsedCard

export async function createCard(
  store: CardStore,
  deckId: string,
  input: CreateCardInput,
): Promise<Card> {
  const order = nextOrder(cardsForDeck(selectCards(store.getState()), deckId))
  const card = makeCard({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    deckId,
    order,
  })
  await store.getState().save(card)
  return card
}
