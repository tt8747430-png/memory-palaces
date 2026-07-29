import { type Deck, type DeckChanges, updateDeck } from '@/entities/deck'
import { collectionCommands } from '@/shared/lib'

/** Deleting a deck cascades into its subtree, so it keeps its own command. */
const commands = collectionCommands<'decks', Deck, DeckChanges>('decks', {
  label: 'Deck',
  update: updateDeck,
})

export const requireDeck = commands.require
export const editDeck = commands.edit
export const reorderDecks = commands.reorder
