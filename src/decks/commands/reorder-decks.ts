import { updateDeck } from '@/decks/model/deck'
import type { DeckStore } from '@/decks/data/stores'

export async function reorderDecks(store: DeckStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.decks().map((deck) => [deck.id, deck]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const deck = byId.get(id)
      if (!deck || deck.order === index) return undefined
      return store.save(updateDeck(deck, { order: index }, now))
    }),
  )
}
