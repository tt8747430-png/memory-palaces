import { type Grade, schedule } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'
import { requireCard } from '@/features/card'

export async function gradeCard(
  store: CardStore,
  cardId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<Card> {
  const existing = requireCard(store, cardId)
  const updated: Card = {
    ...existing,
    srs: schedule(existing.srs, grade, now),
    updatedAt: new Date(now).toISOString(),
  }
  await store.getState().save(updated)
  return updated
}
