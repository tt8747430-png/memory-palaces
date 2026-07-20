import { updateCard } from '@/decks/model/card'
import type { CardStore } from '@/decks/data/stores'

export async function resetCardsSrs(store: CardStore, ids: readonly string[]): Promise<void> {
  const updatedAt = new Date().toISOString()
  const targets = new Set(ids)
  const cards = store.cards().filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) => store.save(updateCard(card, { srs: undefined }, updatedAt))),
  )
}
