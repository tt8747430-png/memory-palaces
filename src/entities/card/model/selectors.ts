import type { Card } from './types'
import type { CardState } from './store'

export const selectCards = (state: CardState): Card[] => state.cards
export const selectIsReady = (state: CardState): boolean => state.status === 'ready'

/** Pure: a deck's OWN cards (attached directly to it), in order. For a deck's whole subtree
 * use `cardsInSubtree` from `@/shared/lib`. Compose in a component with
 * `useMemo(() => cardsForDeck(cards, deckId), [cards, deckId])`. */
export const cardsForDeck = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId)
