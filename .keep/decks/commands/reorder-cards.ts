import { updateCard } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'

export async function reorderCards(store: CardStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.cards().map((card) => [card.id, card]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const card = byId.get(id)
      if (!card || card.order === index) return undefined
      return store.save(updateCard(card, { order: index }, now))
    }),
  )
}
