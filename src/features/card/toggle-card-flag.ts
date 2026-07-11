import { type Card, type CardStore, updateCard } from '@/entities/card'
import { requireCard } from './require-card'

/** Command — flip a card's "flagged" mark (come back to this). */
export async function toggleCardFlag(store: CardStore, id: string): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { flagged: !card.flagged }, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
