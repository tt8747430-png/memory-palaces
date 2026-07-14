import { type Card, type CardChanges, type CardStore, updateCard } from '@/entities/card'
import { requireCard } from './require-card'

export async function editCard(store: CardStore, id: string, changes: CardChanges): Promise<Card> {
  const existing = requireCard(store, id)
  const updated = updateCard(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
