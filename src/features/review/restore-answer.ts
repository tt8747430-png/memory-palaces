import { nowIso } from '@/shared/lib'
import type { Card, CardStore, PriorAnswer } from '@/entities/card'
import { requireCard } from '@/features/card'

export async function restoreAnswer(
  store: CardStore,
  cardId: string,
  prior: PriorAnswer,
  now: number = Date.now(),
): Promise<Card> {
  const existing = requireCard(store, cardId)
  const restored: Card = {
    ...existing,
    srs: prior.srs,
    fastReview: prior.fastReview,
    updatedAt: nowIso(now),
  }
  await store.getState().save(restored)
  return restored
}
