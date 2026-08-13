import { type Card, type CardStore, type FastOutcome, updateCard } from '@/entities/card'
import { nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

export async function setCardFastReview(
  store: CardStore,
  id: string,
  outcome: FastOutcome,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { fastReview: outcome }, nowIso(now))
  await store.getState().save(updated)
  return updated
}

/** Resetting a deck's progress has to clear the fast-review buckets too, or the counts lie. */
export async function clearDeckFastReview(
  store: CardStore,
  cardIds: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  const stamp = nowIso(now)
  for (const id of cardIds) {
    const card = requireCard(store, id)
    if (card.fastReview === undefined) continue
    await store.getState().save(updateCard(card, { fastReview: undefined }, stamp))
  }
}
