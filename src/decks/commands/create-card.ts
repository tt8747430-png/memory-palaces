import { cardsForDeck, makeCard } from '@/decks/model/card'
import type { Card } from '@/decks/model/card'
import type { CardStore } from '@/decks/data/stores'
import { nextOrder, type SrsState } from '@/shared/domain'

export interface CreateCardInput {
  front: string
  back: string
  hint?: string
  tip?: string
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

export async function createCard(
  store: CardStore,
  deckId: string,
  input: CreateCardInput,
): Promise<Card> {
  const order = nextOrder(cardsForDeck(store.cards(), deckId))
  const card = makeCard({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    deckId,
    order,
  })
  await store.save(card)
  return card
}
