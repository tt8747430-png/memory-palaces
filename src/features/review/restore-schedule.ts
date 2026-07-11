import type { SrsState } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'

/**
 * Command — reverse a graded card's SRS write by restoring the schedule it held before the
 * grade. Paired with the session machine's `undo`: the widget captures each card's prior `srs`
 * as it grades, then hands it back here on undo. `undefined` is a first-ever grade being undone,
 * returning the card to brand-new. `now` is injected so `updatedAt` rides the same clock as the
 * rest of the write-path.
 */
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
