import { type Card, type CardChanges, type CardStore, updateCard } from '@/entities/card'
import { requireCard } from './require-card'
import { nowIso } from '@/shared/lib'

export async function editCard(store: CardStore, id: string, changes: CardChanges): Promise<Card> {
  const existing = requireCard(store, id)
  const updated = updateCard(existing, changes, nowIso())
  await store.getState().save(updated)
  return updated
}
