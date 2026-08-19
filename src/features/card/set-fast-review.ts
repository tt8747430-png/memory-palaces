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
