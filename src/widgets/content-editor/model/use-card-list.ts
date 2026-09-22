import { useMemo } from 'react'
import { type Card, selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import type { ContentSort } from '@/entities/preferences'
import type { LearningAlgorithm } from '@/shared/config/algorithms'
import { cardMaturityCounts, cardsInSubtree, positionsById } from '@/shared/lib'
import {
  type CardListOptions,
  cardListOptions,
  filterCards,
  type MaturityKey,
  sortCards,
} from './card-list'
import { type CardFilterControl, useCardFilter } from './use-card-filter'

export interface CardList {
  /** How the deck is studied — which decides what the list can be sorted and filtered by. */
  algorithm: LearningAlgorithm
  /** The order the learner chose. */
  sort: ContentSort
  /** Every card in the deck and its subdecks. */
  cards: Card[]
  /** The cards in the order the learner chose. */
  sorted: Card[]
  /** What the list shows: the sorted cards narrowed by the search and the filter. */
  visible: Card[]
  /** The visible cards' ids — what select-all covers. */
  visibleIds: string[]
  /** Each card's place in `sorted`, for the number on its row. */
  positionOf: ReadonlyMap<string, number>
  /** The search, lower-cased and trimmed; empty when nothing is being searched. */
  needle: string
  filter: CardFilterControl
  options: CardListOptions
  maturity: Record<MaturityKey, number>
}

export interface CardListInput {
  deckId: string
  algorithm: LearningAlgorithm
  sort: ContentSort
  searchQuery?: string
}

/**
 * A deck's card list, derived once for the whole screen. The page needs the visible ids for its
 * select-all and the cards for its overview; the editor needs the same lists to draw. Deriving
 * them in the editor meant the page learned the ids from an effect — one full extra render of
 * every row on open — and computed the subtree a second time for itself.
 */
export function useCardList({
  deckId,
  algorithm,
  sort,
  searchQuery = '',
}: CardListInput): CardList {
  const allCards = useCardStore(selectCards)
  const decks = useDeckStore(selectDecks)
  const filter = useCardFilter()

  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const sorted = useMemo(() => sortCards(cards, sort), [cards, sort])
  const needle = searchQuery.trim().toLowerCase()
  const visible = useMemo(
    () => filterCards(sorted, needle, filter.applied),
    [sorted, needle, filter.applied],
  )
  const visibleIds = useMemo(() => visible.map((card) => card.id), [visible])
  const positionOf = useMemo(() => positionsById(sorted), [sorted])
  const options = useMemo(() => cardListOptions(cards, algorithm), [cards, algorithm])
  const maturity = useMemo(() => cardMaturityCounts(cards), [cards])

  return {
    algorithm,
    sort,
    cards,
    sorted,
    visible,
    visibleIds,
    positionOf,
    needle,
    filter,
    options,
    maturity,
  }
}
