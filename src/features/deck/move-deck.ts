import { type Deck, type DeckStore, selectDecks } from '@/entities/deck'
import { canReparent, nextOrder, orderSiblings } from '@/shared/lib'
import { editDeck } from './deck-commands'

export async function moveDeck(
  store: DeckStore,
  id: string,
  newParentId: string | null,
  folderId: string | null = null,
): Promise<Deck> {
  const decks = selectDecks(store.getState())
  if (!canReparent(decks, id, newParentId)) {
    throw new Error('Cannot move a deck into its own subtree')
  }
  const targetFolderId = newParentId === null ? folderId : null
  const order = nextOrder(orderSiblings(decks, newParentId, targetFolderId, id))
  return editDeck(store, id, { parentId: newParentId, folderId: targetFolderId, order })
}
