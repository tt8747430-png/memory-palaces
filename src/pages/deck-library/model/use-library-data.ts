import { useCallback, useMemo } from 'react'
import type { Card } from '@/entities/card'
import { selectCards, useCardStore } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import { resolveDeckSettings, selectDecks, useDeckStore } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { selectDeckSort, selectDeckSortSubdecks, usePreferencesStore } from '@/entities/preferences'
import {
  type DeckSort,
  dueCountsPerDeck,
  findEntity,
  type FlatDeck,
  flattenDecks,
  FOLDER_SORTS,
  selectIsReady,
  siblingDecks,
  sortDecks,
  useOptimisticPatch,
} from '@/shared/lib'
import { useLibraryExpanded } from './use-library-expanded'

export interface LibraryView {
  ready: boolean
  isEmpty: boolean
  folders: Folder[]
  decks: Deck[]
  cards: Card[]
  openFolder: Folder | undefined
  folderDeckCounts: Map<string, number>
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  rows: FlatDeck[]
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void
}

export interface LibraryData {
  view: LibraryView
  foldersReady: boolean
  folderIds: ReadonlySet<string>
  /** The order the rows are in, so a drag can put it back to manual before it reorders. */
  deckSort: DeckSort
  /** Whether that order reaches the rows nested under a deck. */
  deckSortSubdecks: boolean
  patchFolders: (patches: Map<string, Partial<Folder>>) => void
  patchDecks: (patches: Map<string, Partial<Deck>>) => void
}

export function useLibraryData(folderId: string | null): LibraryData {
  const storeFolders = useFolderStore(selectFolders)
  const deckSort = usePreferencesStore(selectDeckSort)
  const deckSortSubdecks = usePreferencesStore(selectDeckSortSubdecks)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)

  const [unsorted, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  const { ready: expandedReady, expanded, toggleExpanded, expand } = useLibraryExpanded()

  const folders = useMemo(() => {
    const placed = unsorted.toSorted((a, b) => a.order - b.order)
    return FOLDER_SORTS.has(deckSort) ? sortDecks(placed, deckSort) : placed
  }, [unsorted, deckSort])
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

  const dueCounts = useMemo(
    () =>
      deckSort === 'due'
        ? dueCountsPerDeck(
            decks,
            cards,
            Date.now(),
            (id) => resolveDeckSettings(decks, id).algorithm,
          )
        : null,
    [deckSort, decks, cards],
  )

  const arrange = useCallback(
    (peers: Deck[], depth: number): Deck[] =>
      depth > 0 && !deckSortSubdecks
        ? peers
        : sortDecks(peers, deckSort, (deck) => dueCounts?.get(deck.id) ?? 0),
    [deckSort, deckSortSubdecks, dueCounts],
  )

  const sectionDecks = useMemo(
    () => arrange(siblingDecks(decks, null, folderId), 0),
    [arrange, decks, folderId],
  )
  const rows = useMemo(
    () => flattenDecks(decks, expanded, folderId, arrange),
    [decks, expanded, folderId, arrange],
  )

  return {
    view: {
      ready: foldersReady && decksReady && expandedReady,
      isEmpty: inFolder ? scopedDeckCount === 0 : folders.length === 0 && scopedDeckCount === 0,
      folders,
      decks,
      cards,
      openFolder,
      folderDeckCounts,
      sectionFolders: inFolder ? [] : folders,
      sectionDecks,
      rows,
      expanded,
      toggleExpanded,
      expand,
    },
    foldersReady,
    folderIds,
    deckSort,
    deckSortSubdecks,
    patchFolders,
    patchDecks,
  }
}
