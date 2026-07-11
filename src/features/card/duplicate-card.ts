import { cardsForDeck, type Card, type CardStore, makeCard, selectCards } from '@/entities/card'
import { nextOrder } from '@/shared/lib'
import { requireCard } from './require-card'

/** Command — copy a card's content (front/back/hint/tip) into a fresh card appended to the
 * deck. The copy starts with a clean schedule, unflagged — it's a new card to edit, not a
 * clone of the original's progress. */
export async function duplicateCard(store: CardStore, id: string): Promise<Card> {
  const original = requireCard(store, id)
  const order = nextOrder(cardsForDeck(selectCards(store.getState()), original.deckId))
  const copy = makeCard({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
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
