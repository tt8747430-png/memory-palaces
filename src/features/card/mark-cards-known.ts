import { type CardStore, updateCard } from '@/entities/card'
import { markKnown } from '@/shared/lib'

/** Command — force the given cards into a "known" (mastered) schedule. Serves both the
 * single-row "Mark as known" and the multi-select bulk action; one clock read keeps the batch
 * consistent. */
export async function markCardsKnown(store: CardStore, ids: ReadonlyArray<string>): Promise<void> {
  const now = Date.now()
  const updatedAt = new Date(now).toISOString()
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) =>
      store.getState().save(updateCard(card, { srs: markKnown(card.srs, now) }, updatedAt)),
    ),
  )
}
