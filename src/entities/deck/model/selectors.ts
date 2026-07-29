import type { Deck } from './types'
import type { DeckState } from './store'

export const selectDecks = (state: DeckState): Deck[] => state.decks
