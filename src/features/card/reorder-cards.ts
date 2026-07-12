import { type CardStore, updateCard } from '@/entities/card'

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
