/** Where the cards are going: the learner's choice, or the app's. */
export type VerseTarget =
  { kind: 'automatic' } | { kind: 'deck'; deckId: string } | { kind: 'newDeck'; name: string }

/**
 * Whether the destination can be resolved into a deck at all. Only a new deck can fail: switching
 * "Include in decks" off before a book is picked leaves it with nothing to be called, and that is
 * the moment a learner could otherwise press Add and meet `createDeck`'s "Deck name is required".
 */
export function targetIsResolvable(target: VerseTarget): boolean {
  return target.kind !== 'newDeck' || target.name.trim().length > 0
}
