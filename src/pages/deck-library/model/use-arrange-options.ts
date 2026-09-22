import { useMemo } from 'react'
import type { Card } from '@/entities/card'
import { type Deck, resolveDeckSettings } from '@/entities/deck'
import {
  type DeckSort,
  dueCountsPerDeck,
  filtersThatKeep,
  ordersThatPlace,
  useExtensionPoint,
} from '@/shared/lib'
import { type LibraryFilter } from './library-filter'

export interface ArrangeOptions {
  /** The orders on offer, by id — an applied one the learner still has to be able to undo aside. */
  sorts: ReadonlySet<DeckSort>
  /** The filters on offer, by id. `all` is always one of them. */
  filters: ReadonlySet<LibraryFilter>
  /** Fewer than two rows and there is no arrangement to pick: the control itself goes. */
  canSort: boolean
  /** Nothing beyond `all` narrows this list, so there is nothing to show a Show menu for. */
  canFilter: boolean
  /** Some live deck has a subdeck, so the switch that reaches every level has something to reach. */
  canAllSubdecks: boolean
}

export interface ArrangeOptionsArgs {
  /** The rows at the level being arranged, before the filter narrows them. */
  levelDecks: readonly Deck[]
  /** Every deck, which a due roll-up and the subdeck question both need. */
  decks: readonly Deck[]
  cards: readonly Card[]
  /**
   * The arrange bar only exists while a selection is on. Everything here — the due counts most of
   * all — is worked out only then, so a Library nobody is arranging pays nothing for the answer.
   */
  enabled: boolean
  /** The rows are one deck's subdecks rather than a whole level of the Library. */
  scoped: boolean
}

const EMPTY: ReadonlySet<string> = new Set()

const NOTHING: ArrangeOptions = {
  sorts: EMPTY,
  filters: EMPTY,
  canSort: false,
  canFilter: false,
  canAllSubdecks: false,
}

/**
 * Which orders and filters can change the list in front of the learner. An option that would leave
 * the rows exactly as they are — a `due` order with nothing due, a book filter with no book of
 * that kind here — is not offered, so the menus say what this Library can actually do rather than
 * what the app can do in principle.
 */
export function useArrangeOptions({
  levelDecks,
  decks,
  cards,
  enabled,
  scoped,
}: ArrangeOptionsArgs): ArrangeOptions {
  const orders = useExtensionPoint('deckSorts')
  const filters = useExtensionPoint('deckFilters')

  const anyDue = useMemo(() => {
    if (!enabled || levelDecks.length === 0) return false
    const counts = dueCountsPerDeck(
      decks,
      cards,
      Date.now(),
      (id) => resolveDeckSettings(decks, id).algorithm,
    )
    return levelDecks.some((deck) => (counts.get(deck.id) ?? 0) > 0)
  }, [enabled, levelDecks, decks, cards])

  return useMemo(() => {
    if (!enabled) return NOTHING

    // `manual` is the order a drag writes and `name`/`recent` read off a row's own fields, so all
    // three apply to any two rows at all. `due` needs something waiting.
    const sorts = new Set<DeckSort>(['manual', 'name', 'recent'])
    if (anyDue) sorts.add('due')
    for (const id of ordersThatPlace(levelDecks, orders)) sorts.add(id)

    const offered = new Set<LibraryFilter>(['all'])
    if (levelDecks.some((deck) => deck.favorite)) offered.add('favorites')
    if (anyDue) offered.add('due')
    for (const id of filtersThatKeep(levelDecks, filters)) offered.add(id)

    return {
      sorts,
      filters: offered,
      canSort: levelDecks.length > 1,
      canFilter: offered.size > 1,
      // The switch is a statement about the whole Library — it writes `deckSortSubdecks` and wipes
      // every per-deck order — so it asks a Library-wide question. But it is withheld inside a
      // scope: there the learner is setting one deck's own order, and this would throw it away.
      canAllSubdecks: !scoped && decks.some((deck) => deck.parentId !== null && !deck.archived),
    }
  }, [enabled, anyDue, levelDecks, decks, orders, filters, scoped])
}
