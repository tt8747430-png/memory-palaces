import { type DeckMove, type DeckStore, placeDecks, selectDecks } from '@/entities/deck'
import { canReparent } from '@/shared/lib'
import { editDeck, requireDeck } from './deck-commands'

export async function moveDecks(
  store: DeckStore,
  moves: readonly DeckMove[],
  at = Date.now(),
): Promise<void> {
  const decks = selectDecks(store.getState())
  for (const { id, to } of moves) {
    requireDeck(store, id)
    if (!canReparent(decks, id, to.parentId)) {
      throw new Error('Cannot move a deck into its own subtree')
    }
  }
  const placed = placeDecks(decks, moves)
  await Promise.all([...placed].map(([id, changes]) => editDeck(store, id, changes, at)))
}
