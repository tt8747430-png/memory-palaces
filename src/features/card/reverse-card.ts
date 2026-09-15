import { type Card, type CardStore, updateCard } from '@/entities/card'
import { nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

export async function toggleCardReversed(
  store: CardStore,
  id: string,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { reversed: !card.reversed }, nowIso(now))
  await store.getState().save(updated)
  return updated
}
