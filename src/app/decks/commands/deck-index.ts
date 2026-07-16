export { createDeck, createSubdeck } from './create-deck'
export type { CreateDeckInput } from './create-deck'
export { editDeck } from './edit-deck'
export { deleteDeck } from './delete-deck'
export { duplicateDeck } from './duplicate-deck'
export { toggleDeckFavorite } from './toggle-favorite'
export { setDeckArchived } from './set-archived'
export { setDeckFolder } from './set-folder'
export { moveDeck } from './move-deck'
export { reorderDecks } from './reorder-decks'
export { requireDeck } from './require-deck'

// Bulk use-cases: one command per selection, rather than a loop at the caller.
// "Unfile" is deliberately absent — it is moveDecks(store, ids, null, null).
export { setDecksArchived } from './set-decks-archived'
export { setDecksFavorite } from './set-decks-favorite'
export { moveDecks } from './move-decks'
export { duplicateDecks } from './duplicate-decks'
export { deleteDecks } from './delete-decks'
