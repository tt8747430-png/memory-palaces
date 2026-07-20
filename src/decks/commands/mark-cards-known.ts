import { updateCard } from '@/decks/model/card'
import type { CardStore } from '@/decks/data/stores'
import { markKnown } from '@/shared/domain'

export async function markCardsKnown(store: CardStore, ids: readonly string[]): Promise<void> {
  const now = Date.now()
  const updatedAt = new Date(now).toISOString()
  const targets = new Set(ids)
  const cards = store.cards().filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) => store.save(updateCard(card, { srs: markKnown(card.srs, now) }, updatedAt))),
  )
}
