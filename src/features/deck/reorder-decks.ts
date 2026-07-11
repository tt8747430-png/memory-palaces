import { type DeckStore, updateDeck } from '@/entities/deck'

/**
 * Command — persist a manual deck order within one container. Given the ids in their new order,
 * write each deck's `order` to match its index. Only changed decks are saved, so a no-op drag
 * costs nothing. The caller passes the ids of a single container (a folder, the root, or one
 * parent deck's subdecks) in their final order.
 */
export async function reorderDecks(store: DeckStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().decks.map((deck) => [deck.id, deck]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const deck = byId.get(id)
      if (!deck || deck.order === index) return undefined
      return store.getState().save(updateDeck(deck, { order: index }, now))
    }),
  )
}
