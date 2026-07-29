import { nowIso, type SrsState } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'
import { requireCard } from '@/features/card'

export async function restoreSchedule(
  store: CardStore,
  cardId: string,
  srs: SrsState | undefined,
  now: number = Date.now(),
): Promise<Card> {
  const existing = requireCard(store, cardId)
  const restored: Card = {
    ...existing,
    srs,
    updatedAt: nowIso(now),
  }
  await store.getState().save(restored)
  return restored
}
