import type { Deck } from './types'
import type { DeckState } from './store'

export const selectDecks = (state: DeckState): Deck[] => state.decks
export const selectDeckCount = (state: DeckState): number => state.decks.length
export const selectIsReady = (state: DeckState): boolean => state.status === 'ready'
