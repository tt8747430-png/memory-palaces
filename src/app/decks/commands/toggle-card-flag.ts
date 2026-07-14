import { updateCard } from '@app/decks/model/card'
import type { Card } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'
import { requireCard } from './require-card'

export async function toggleCardFlag(store: CardStore, id: string): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { flagged: !card.flagged }, new Date().toISOString())
  await store.save(updated)
  return updated
}
