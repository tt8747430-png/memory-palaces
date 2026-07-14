import type { SrsState } from '@app/shared/domain'
import type { Card } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'

export async function restoreSchedule(
  store: CardStore,
  cardId: string,
  srs: SrsState | undefined,
  now: number = Date.now(),
): Promise<Card> {
  const existing = store.cards().find((card) => card.id === cardId)
  if (!existing) throw new Error(`Card not found: ${cardId}`)
  const restored: Card = {
    ...existing,
    srs,
    updatedAt: new Date(now).toISOString(),
  }
  await store.save(restored)
  return restored
}
