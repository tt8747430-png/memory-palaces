import type { SrsState } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'

export async function restoreSchedule(
  store: CardStore,
  cardId: string,
  srs: SrsState | undefined,
  now: number = Date.now(),
): Promise<Card> {
  const existing = store.getState().cards.find((card) => card.id === cardId)
  if (!existing) throw new Error(`Card not found: ${cardId}`)
  const restored: Card = {
    ...existing,
    srs,
    updatedAt: new Date(now).toISOString(),
  }
  await store.getState().save(restored)
  return restored
}
