import { cardsForDeck, type Card, type CardStore, makeCard, selectCards } from '@/entities/card'
import { nextOrder, type SrsState } from '@/shared/lib'

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
