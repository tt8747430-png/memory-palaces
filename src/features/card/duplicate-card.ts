import { type Card, cardsForDeck, type CardStore, makeCard, selectCards } from '@/entities/card'
import { newId, nextOrder, nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

export async function duplicateCard(
  store: CardStore,
  id: string,
  now: number = Date.now(),
): Promise<Card> {
  const original = requireCard(store, id)
  const order = nextOrder(cardsForDeck(selectCards(store.getState()), original.deckId))
  const copy = makeCard({
    id: newId(),
    createdAt: nowIso(now),
    deckId: original.deckId,
    front: original.front,
    back: original.back,
    hint: original.hint,
    tip: original.tip,
    order,
  })
  await store.getState().save(copy)
  return copy
}
