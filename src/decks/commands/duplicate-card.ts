import { cardsForDeck, makeCard } from '@/decks/model/card'
import type { Card } from '@/decks/model/card'
import type { CardStore } from '@/decks/data/stores'
import { nextOrder } from '@/shared/domain'
import { requireCard } from './require-card'

export async function duplicateCard(store: CardStore, id: string): Promise<Card> {
  const original = requireCard(store, id)
  const order = nextOrder(cardsForDeck(store.cards(), original.deckId))
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
  await store.save(copy)
  return copy
}
