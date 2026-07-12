import type { Card } from './types'
import type { CardState } from './store'

export const selectCards = (state: CardState): Card[] => state.cards
export const selectIsReady = (state: CardState): boolean => state.status === 'ready'

export const cardsForDeck = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId)
