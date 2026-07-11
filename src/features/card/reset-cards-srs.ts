import { type CardStore, updateCard } from '@/entities/card'

/** Command — clear the spaced-repetition schedule of the given cards, returning them to "new".
 * Serves both the single-row "Reset schedule" and the multi-select bulk action. */
export async function resetCardsSrs(store: CardStore, ids: ReadonlyArray<string>): Promise<void> {
  const updatedAt = new Date().toISOString()
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) => store.getState().save(updateCard(card, { srs: undefined }, updatedAt))),
  )
}
