import { useCallback, useMemo } from 'react'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, resolveDeckSettings } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import {
  selectDeckFilter,
  selectDeckSort,
  selectDeckSortSubdecks,
  selectSubdeckSorts,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  arrangeLibrary,
  dueCountsPerDeck,
  type LibraryArrangement,
  type LibraryOrderPreferences,
  needsDueCounts,
  useExtensionPoint,
} from '@/shared/lib'

/**
 * The Library's arrangement of these decks and folders, as the learner has set it: the order at
 * every level, the filter, the orders and filters extensions contribute, and — only when one of
 * them reads it — what each deck has waiting. Every list of decks reads this, so none of them can
 * arrange on its own.
 *
 * The decks and folders are the caller's, so a screen holding optimistic writes (the Library, mid
 * drag) arranges what it is showing rather than what the store has confirmed.
 */
export function useLibraryArrangement(
  decks: readonly Deck[],
  folders: readonly Folder[],
): LibraryArrangement<Deck, Folder> {
  const deckSort = usePreferencesStore(selectDeckSort)
  const deckSortSubdecks = usePreferencesStore(selectDeckSortSubdecks)
  const subdeckSorts = usePreferencesStore(selectSubdeckSorts)
  const filter = usePreferencesStore(selectDeckFilter)
  const orders = useExtensionPoint('deckSorts')
  const filters = useExtensionPoint('deckFilters')
  const cards = useCardStore(selectCards)

  const prefs = useMemo<LibraryOrderPreferences>(
    () => ({ deckSort, deckSortSubdecks, subdeckSorts, filter }),
    [deckSort, deckSortSubdecks, subdeckSorts, filter],
  )

  const needsDue = needsDueCounts(prefs)
  const dueCounts = useMemo(
    () =>
      needsDue
        ? dueCountsPerDeck(
            decks,
            cards,
            Date.now(),
            (id) => resolveDeckSettings(decks, id).algorithm,
          )
        : null,
    [needsDue, decks, cards],
  )
  const dueOf = useCallback((deck: Deck) => dueCounts?.get(deck.id) ?? 0, [dueCounts])

  return useMemo(
    () => arrangeLibrary({ decks, folders, prefs, orders, filters, dueOf }),
    [decks, folders, prefs, orders, filters, dueOf],
  )
}
