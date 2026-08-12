import { type Card, cardsForDeck, type CardStore, moveCard, selectCards } from '@/entities/card'
import { findEntity, nextOrder, nowIso } from '@/shared/lib'

/** Where a card sat before a move, so the surface that moved it can offer undo. */
export interface CardPlacement {
  id: string
  deckId: string
  order: number
}

const placementOf = (card: Card): CardPlacement => ({
  id: card.id,
  deckId: card.deckId,
  order: card.order,
})

/**
 * The one way cards change decks. Ids the store no longer holds and cards already in the target
 * deck are skipped, the rest land after the deck's last card in the order given, and what comes
 * back is where they were — the exact input `restoreCardPlacements` needs. Moving nothing returns
 * an empty list, so a caller can stay silent instead of toasting a no-op.
 */
export async function moveCards(
  store: CardStore,
  ids: readonly string[],
  deckId: string,
  now: number = Date.now(),
): Promise<CardPlacement[]> {
  const cards = selectCards(store.getState())
  const moving = ids
    .map((id) => findEntity(cards, id))
    .filter((card): card is Card => card !== undefined && card.deckId !== deckId)
  if (moving.length === 0) return []

  const previous = moving.map(placementOf)
  const updatedAt = nowIso(now)
  let order = nextOrder(cardsForDeck(cards, deckId))
  for (const card of moving) {
    await store.getState().save(moveCard(card, deckId, order, updatedAt))
    order += 1
  }
  return previous
}

/** Puts moved cards back where they were. Cards deleted since the move are skipped. */
export async function restoreCardPlacements(
  store: CardStore,
  placements: readonly CardPlacement[],
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = nowIso(now)
  for (const { id, deckId, order } of placements) {
    const card = findEntity(selectCards(store.getState()), id)
    if (card) await store.getState().save(moveCard(card, deckId, order, updatedAt))
  }
}
