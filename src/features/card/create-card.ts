import { cardsForDeck, type Card, type CardStore, makeCard, selectCards } from '@/entities/card'
import { nextOrder, type SrsState } from '@/shared/lib'

export interface CreateCardInput {
  front: string
  back: string
  hint?: string
  tip?: string
  /** Restored on import (Mindscape full-fidelity); left unset for a hand-created card. */
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

/** Command — add a card to a deck. The single write-path (UI + import + future Tutor); new
 * cards append to the end of the deck's order. Import carries the optional flag/known/schedule
 * fields through; the editor leaves them unset so a new card starts fresh. */
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
