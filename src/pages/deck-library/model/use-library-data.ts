import { useEffect, useMemo } from 'react'
import type { Card } from '@/entities/card'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import {
  selectFolders,
  selectIsReady as selectFoldersReady,
  useFolderStore,
  useFolderStoreApi,
} from '@/entities/folder'
import {
  type FlatDeck,
  flattenDecks,
  siblingDecks,
  useOptimisticPatch,
  usePersistedSet,
} from '@/shared/lib'

export interface LibraryData {
  folders: Folder[]
  decks: Deck[]
  cards: Card[]
  patchFolders: (patches: Map<string, Partial<Folder>>) => void
  patchDecks: (patches: Map<string, Partial<Deck>>) => void
  ready: boolean
  foldersReady: boolean
  /** This scope's folder record, once the store has emitted it. */
  openFolder: Folder | undefined
  sortedFolders: Folder[]
  folderIds: ReadonlySet<string>
  folderDeckCounts: Map<string, number>
  /** The rows select mode shows: this scope's folders and its top-level decks. */
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  /** The browse tree: this scope's decks, nested, descending only into what is expanded. */
  rows: FlatDeck[]
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void
  isEmpty: boolean
}

/**
 * The library's data layer: the three stores it reads, the optimistic overlay a drop needs, and
 * every shape derived from them. The page is left to decide what to draw, not how to gather it.
 */
export function useLibraryData(folderId: string | null): LibraryData {
  const folderStore = useFolderStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  useEffect(() => {
    folderStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
  }, [folderStore, deckStore, cardStore])

  const storeFolders = useFolderStore(selectFolders)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectFoldersReady)
  const decksReady = useDeckStore(selectDecksReady)

  // A drop shows up instantly and stays put: the new order and parent are held over the store's
  // emissions until the persisted rows agree with them.
  const [folders, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  // Which decks are expanded persists across app restarts (view state, not domain).
  const [expanded, setExpanded] = usePersistedSet('mindscape.library.expanded')
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const expand = (id: string) => setExpanded((prev) => new Set(prev).add(id))

  const openFolder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])
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

  const sectionDecks = useMemo(() => siblingDecks(decks, null, folderId), [decks, folderId])
  const rows = useMemo(() => flattenDecks(decks, expanded, folderId), [decks, expanded, folderId])

  return {
    folders,
    decks,
    cards,
    patchFolders,
    patchDecks,
    ready: foldersReady && decksReady,
    foldersReady,
    openFolder,
    sortedFolders,
    folderIds,
    folderDeckCounts,
    sectionFolders: inFolder ? [] : sortedFolders,
    sectionDecks,
    rows,
    expanded,
    toggleExpanded,
    expand,
    isEmpty: inFolder ? scopedDeckCount === 0 : sortedFolders.length === 0 && scopedDeckCount === 0,
  }
}
