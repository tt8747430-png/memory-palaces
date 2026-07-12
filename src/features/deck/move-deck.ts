import { selectDecks, type Deck, type DeckStore } from '@/entities/deck'
import { canReparent } from '@/shared/lib'
import { editDeck } from './edit-deck'

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
  const siblings = decks.filter((d) =>
    newParentId === null
      ? d.id !== id && d.parentId === null && d.folderId === targetFolderId
      : d.id !== id && d.parentId === newParentId,
  )
  const order = siblings.length ? Math.max(...siblings.map((d) => d.order)) + 1 : 0
  return editDeck(store, id, { parentId: newParentId, folderId: targetFolderId, order })
}
