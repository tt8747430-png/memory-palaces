import { type Card, type CardStore, updateCard } from '@/entities/card'
import { requireCard } from './card-commands'
import { nowIso } from '@/shared/lib'

export async function toggleCardFlag(
  store: CardStore,
  id: string,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { flagged: !card.flagged }, nowIso(now))
  await store.getState().save(updated)
  return updated
}
