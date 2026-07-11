import type { Deck } from './types'
import type { DeckState } from './store'

/** Read surface for deck state. Each returns a stable reference/primitive so
 * `useDeckStore(selector)` re-renders only when the selected value changes. */
export const selectDecks = (state: DeckState): Deck[] => state.decks
export const selectDeckCount = (state: DeckState): number => state.decks.length
export const selectIsReady = (state: DeckState): boolean => state.status === 'ready'
