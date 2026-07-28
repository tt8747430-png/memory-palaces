import { useMemo } from 'react'
import type { Card } from '@/entities/card'
import { selectCards, useCardStore } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import { selectDecks, useDeckStore } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { selectFolders, useFolderStore } from '@/entities/folder'
import {
  type FlatDeck,
  flattenDecks,
  selectIsReady,
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
  openFolder: Folder | undefined
  sortedFolders: Folder[]
  folderIds: ReadonlySet<string>
  folderDeckCounts: Map<string, number>
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  rows: FlatDeck[]
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void
  isEmpty: boolean
}

export function useLibraryData(folderId: string | null): LibraryData {
  const storeFolders = useFolderStore(selectFolders)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)

  const [folders, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

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
