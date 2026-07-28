import { reorderById } from '@/shared/lib'
import { type CardStore, updateCard } from '@/entities/card'

export function reorderCards(store: CardStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  return reorderById(store.getState().cards, orderedIds, (card, order) =>
    store.getState().save(updateCard(card, { order }, now)),
  )
}
