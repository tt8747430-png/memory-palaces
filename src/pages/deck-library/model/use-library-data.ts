import { useMemo } from 'react'
import type { Card } from '@/entities/card'
import { selectCards, useCardStore } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import { selectDecks, useDeckStore } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { selectFolders, useFolderStore } from '@/entities/folder'
import {
  selectDeckSortSubdecks,
  selectSubdeckSorts,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  type DeckGroup,
  type DeckSort,
  findEntity,
  type FlatDeck,
  folderOrderOf,
  orderId,
  selectIsReady,
  useOptimisticPatch,
} from '@/shared/lib'
import { useLibraryArrangement } from '@/widgets/deck-tree'
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
}

const NO_FOLDERS: Folder[] = []

/**
 * The Library as the page draws it. Every order, filter and heading is the one arrangement
 * (`useLibraryArrangement`) the move sheet and the deck switcher read too; this adds only what is
 * the page's own — which folder or scope is open, what is expanded, and the writes still in flight.
 */
export function useLibraryData({ folderId, scopeId }: LibraryDataArgs): LibraryData {
  const storeFolders = useFolderStore(selectFolders)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const deckSortSubdecks = usePreferencesStore(selectDeckSortSubdecks)
  const subdeckSorts = usePreferencesStore(selectSubdeckSorts)

  const [patchedFolders, patchFolders] = useOptimisticPatch(storeFolders)
  const [patchedDecks, patchDecks] = useOptimisticPatch(storeDecks)
  const { ready: expandedReady, expanded, toggleExpanded, expand } = useLibraryExpanded()

  const arrangement = useLibraryArrangement(patchedDecks, patchedFolders)
  const { decks, folders } = arrangement

  const scope = useMemo(() => findEntity(decks, scopeId) ?? null, [decks, scopeId])
  const shelf = arrangement.shelf(scope ? { deckId: scope.id } : { folderId })
  const lookedAt = arrangement.orderAt(scope ? scope.id : null)
  const inFolder = folderId !== null

  const openFolder = useMemo(() => findEntity(folders, folderId), [folders, folderId])
  const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders])
  const folderDeckCounts = useMemo(
    () =>
      new Map(folders.map((f) => [f.id, arrangement.shelf({ folderId: f.id }).levelDecks.length])),
    [arrangement, folders],
  )
  const rows = useMemo(
    () => arrangement.flatten({ folderId }, expanded),
    [arrangement, folderId, expanded],
  )
  const placedHere = arrangement.shelf({ folderId }).levelDecks.length

  return {
    view: {
      ready: foldersReady && decksReady && expandedReady,
      isEmpty: inFolder ? placedHere === 0 : folders.length === 0 && placedHere === 0,
      folders,
      decks,
      cards,
      openFolder,
      scope,
      folderDeckCounts,
      sectionFolders: inFolder || scope ? NO_FOLDERS : folders,
      sectionDecks: shelf.decks,
      levelDecks: shelf.levelDecks,
      hidden: shelf.hidden,
      headings: shelf.headings,
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
    canReorderFolders: folderOrderOf(arrangement.orderAt(null)) === null,
    patchFolders,
    patchDecks,
  }
}
