import { type Card, type CardStore, updateCard } from '@/entities/card'
import { nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

/** A frozen card keeps its schedule and its place; it simply stops being offered. */
export async function toggleCardFrozen(
  store: CardStore,
  id: string,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { frozen: !card.frozen }, nowIso(now))
  await store.getState().save(updated)
  return updated
}
