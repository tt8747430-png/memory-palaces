import { reorderById } from '@/shared/lib'
import { type DeckStore, updateDeck } from '@/entities/deck'

export function reorderDecks(store: DeckStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  return reorderById(store.getState().decks, orderedIds, (deck, order) =>
    store.getState().save(updateDeck(deck, { order }, now)),
  )
}
