import { type Grade, schedule } from '@app/shared/domain'
import type { Card } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'

export async function gradeCard(
  store: CardStore,
  cardId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<Card> {
  const existing = store.cards().find((card) => card.id === cardId)
  if (!existing) throw new Error(`Card not found: ${cardId}`)
  const updated: Card = {
    ...existing,
    srs: schedule(existing.srs, grade, now),
    updatedAt: new Date(now).toISOString(),
  }
  await store.save(updated)
  return updated
}
