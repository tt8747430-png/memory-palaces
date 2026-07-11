import { type CardStore, updateCard } from '@/entities/card'

/**
 * Command — persist a manual card order within a deck. Given the card ids in their new order,
 * write each card's `order` to match its index. Only changed cards are saved, so a no-op drag
 * costs nothing. Used by the content editor's drag-to-reorder; the caller passes the ids of one
 * deck's cards in their final order.
 */
export async function reorderCards(store: CardStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().cards.map((card) => [card.id, card]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const card = byId.get(id)
      if (!card || card.order === index) return undefined
      return store.getState().save(updateCard(card, { order: index }, now))
    }),
  )
}
