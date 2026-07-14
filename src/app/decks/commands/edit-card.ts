import { updateCard } from '@app/decks/model/card'
import type { Card, CardChanges } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'
import { requireCard } from './require-card'

export async function editCard(store: CardStore, id: string, changes: CardChanges): Promise<Card> {
  const existing = requireCard(store, id)
  const updated = updateCard(existing, changes, new Date().toISOString())
  await store.save(updated)
  return updated
}
