import { cardsForDeck, type Card, type CardStore, makeCard, selectCards } from '@/entities/card'
import { newId, nextOrder, nowIso, type ParsedCard } from '@/shared/lib'
/** A card as it arrives from a form, a paste or an import file. */
export type CreateCardInput = ParsedCard

export async function createCard(
  store: CardStore,
  deckId: string,
  input: CreateCardInput,
  now: number = Date.now(),
): Promise<Card> {
  const order = nextOrder(cardsForDeck(selectCards(store.getState()), deckId))
  const card = makeCard({
    ...input,
    id: newId(),
    createdAt: nowIso(now),
    deckId,
    order,
  })
  await store.getState().save(card)
  return card
}
