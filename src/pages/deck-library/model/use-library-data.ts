import { useCallback, useMemo } from 'react'
import type { Card } from '@/entities/card'
import { selectCards, useCardStore } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import { resolveDeckSettings, selectDecks, useDeckStore } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { selectFolders, useFolderStore } from '@/entities/folder'
import {
  selectDeckSort,
  selectDeckSortSubdecks,
  selectSubdeckSorts,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  type DeckFilterId,
  type DeckGroup,
  type DeckSort,
  dueCountsPerDeck,
  findEntity,
  type FlatDeck,
  flattenDecks,
  folderOrderOf,
  headingsFor,
  orderForChildren,
  orderId,
  resolveDeckOrder,
  selectIsReady,
  siblingDecks,
  sortDecks,
  useExtensionPoint,
  useOptimisticPatch,
} from '@/shared/lib'
import { filterDecks } from './library-filter'
import { useLibraryExpanded } from './use-library-expanded'

export interface LibraryView {
  ready: boolean
  isEmpty: boolean
  folders: Folder[]
  decks: Deck[]
  cards: Card[]
  openFolder: Folder | undefined
  /** The deck whose subdecks are being looked at on their own, while one is. */
  scope: Deck | null
  folderDeckCounts: Map<string, number>
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  /** The rows at this level before the filter narrows them — what the arrange bar reasons about. */
  levelDecks: Deck[]
  /** How many decks the filter is keeping off the list. */
  hidden: number
  /** The heading to print over a row, by the row's id, when the order shelves the rows. */
  headings: ReadonlyMap<string, DeckGroup>
  rows: FlatDeck[]
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void
}

export interface LibraryData {
  view: LibraryView
  foldersReady: boolean
  folderIds: ReadonlySet<string>
  /** The order the rows being looked at are in — resolved, so an order nobody offers reads as manual. */
  deckSort: DeckSort
  /** Whether the Library order reaches every subdeck, or some deck's subdecks have an order of their own. */
  allSubdecks: boolean
  /** A drag can only write an order where the rows are in the manual one. */
  canReorderDecks: boolean
  canReorderFolders: boolean
  patchFolders: (patches: Map<string, Partial<Folder>>) => void
  patchDecks: (patches: Map<string, Partial<Deck>>) => void
}

export interface LibraryDataArgs {
  folderId: string | null
  /** A deck whose subdecks are the rows being looked at, or null for the folder's top level. */
  scopeId: string | null
  filter: DeckFilterId
}

export function useLibraryData({ folderId, scopeId, filter }: LibraryDataArgs): LibraryData {
  const storeFolders = useFolderStore(selectFolders)
  const deckSort = usePreferencesStore(selectDeckSort)
  const deckSortSubdecks = usePreferencesStore(selectDeckSortSubdecks)
  const subdeckSorts = usePreferencesStore(selectSubdeckSorts)
  const contributed = useExtensionPoint('deckSorts')
  const filters = useExtensionPoint('deckFilters')
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)

  const [unsorted, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  const { ready: expandedReady, expanded, toggleExpanded, expand } = useLibraryExpanded()

  // Which order each level follows, resolved against the orders on offer right now.
  const orderAt = useCallback(
    (parentId: string | null) =>
      resolveDeckOrder(
        orderForChildren(parentId, { deckSort, deckSortSubdecks, subdeckSorts }),
        contributed,
      ),
    [deckSort, deckSortSubdecks, subdeckSorts, contributed],
  )
  const topOrder = orderAt(null)
  const scope = useMemo(() => findEntity(decks, scopeId) ?? null, [decks, scopeId])
  const lookedAt = scope ? orderAt(scope.id) : topOrder

  // A folder follows the Library order only when it is one a shelf can follow; otherwise it keeps
  // the order it was dragged into.
  const folderOrder = folderOrderOf(topOrder)
  const folders = useMemo(() => {
    const placed = unsorted.toSorted((a, b) => a.order - b.order)
    return folderOrder ? sortDecks(placed, folderOrder) : placed
  }, [unsorted, folderOrder])
  const openFolder = useMemo(() => findEntity(folders, folderId), [folders, folderId])
  const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders])
  const inFolder = folderId !== null

  const folderDeckCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of decks) {
      if (d.parentId === null && d.folderId && !d.archived) {
        counts.set(d.folderId, (counts.get(d.folderId) ?? 0) + 1)
      }
    }
    return counts
  }, [decks])

  const scopedDeckCount = useMemo(
    () =>
      decks.filter((d) => d.parentId === null && (d.folderId ?? null) === folderId && !d.archived)
        .length,
    [decks, folderId],
  )

  /*
   * Only counted when something reads it — but *everything* that reads it. `rows` flattens the
   * whole expanded tree and sorts each level by `orderAt(parentId)`, so a per-deck `due` order in
   * `subdeckSorts` needs the counts even when neither the top level nor the scoped level is in it.
   * Miss one and `dueOf` answers 0 for every deck, which does not fail — it silently sorts that
   * level by name instead.
   */
  const dueSubdeck = Object.values(subdeckSorts).some((order) => order === 'due')
  const needsDue = filter === 'due' || topOrder === 'due' || lookedAt === 'due' || dueSubdeck
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

  // Peers share a parent, so the level's order is the first row's parent's.
  const arrange = useCallback(
    (peers: Deck[]): Deck[] => sortDecks(peers, orderAt(peers[0]?.parentId ?? null), dueOf),
    [orderAt, dueOf],
  )

  const unfiltered = useMemo(
    () =>
      scope ? arrange(siblingDecks(decks, scope.id)) : arrange(siblingDecks(decks, null, folderId)),
    [arrange, decks, scope, folderId],
  )
  const sectionDecks = useMemo(
    () => filterDecks(unfiltered, filter, dueOf, filters),
    [unfiltered, filter, dueOf, filters],
  )
  const headings = useMemo(() => headingsFor(sectionDecks, lookedAt), [sectionDecks, lookedAt])

  /*
   * The tree, arranged and then narrowed — but narrowed at depth 0 only. The filter is about the
   * list being looked at; applying it further down would drop a subdeck from the deck it belongs to
   * rather than from the list, and a parent kept by the filter would open onto a hole. Depth 0 is
   * the same set `sectionDecks` holds, so the two views of one Library agree by construction.
   */
  const arrangeRows = useCallback(
    (peers: Deck[], depth: number): Deck[] =>
      depth === 0 ? filterDecks(arrange(peers), filter, dueOf, filters) : arrange(peers),
    [arrange, filter, dueOf, filters],
  )
  const rows = useMemo(
    () => flattenDecks(decks, expanded, folderId, arrangeRows),
    [decks, expanded, folderId, arrangeRows],
  )

  return {
    view: {
      ready: foldersReady && decksReady && expandedReady,
      isEmpty: inFolder ? scopedDeckCount === 0 : folders.length === 0 && scopedDeckCount === 0,
      folders,
      decks,
      cards,
      openFolder,
      scope,
      folderDeckCounts,
      sectionFolders: inFolder || scope ? [] : folders,
      sectionDecks,
      levelDecks: unfiltered,
      hidden: unfiltered.length - sectionDecks.length,
      headings,
      rows,
      expanded,
      toggleExpanded,
      expand,
    },
    foldersReady,
    folderIds,
    deckSort: orderId(lookedAt),
    allSubdecks: deckSortSubdecks && Object.keys(subdeckSorts).length === 0,
    canReorderDecks: lookedAt === 'manual',
    canReorderFolders: folderOrder === null,
    patchFolders,
    patchDecks,
  }
}
