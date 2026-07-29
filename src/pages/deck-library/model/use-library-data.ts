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
  toggleInSet,
  useOptimisticPatch,
  usePersistedSet,
  findEntity,
} from '@/shared/lib'

/**
 * Everything the library screen reads. Declared once here and carried through
 * `useLibrary` unchanged, so a field cannot be added to the data hook and go
 * missing from the screen's view of it.
 */
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
  /** Folders alone settle whether an open folder is missing or merely unloaded. */
  foldersReady: boolean
  folderIds: ReadonlySet<string>
  patchFolders: (patches: Map<string, Partial<Folder>>) => void
  patchDecks: (patches: Map<string, Partial<Deck>>) => void
}

export function useLibraryData(folderId: string | null): LibraryData {
  const storeFolders = useFolderStore(selectFolders)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)

  const [unsorted, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  const [expanded, setExpanded] = usePersistedSet('mindscape.library.expanded')
  const toggleExpanded = (id: string) => setExpanded((prev) => toggleInSet(prev, id))
  const expand = (id: string) => setExpanded((prev) => new Set(prev).add(id))

  const folders = useMemo(() => [...unsorted].sort((a, b) => a.order - b.order), [unsorted])
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

  const sectionDecks = useMemo(() => siblingDecks(decks, null, folderId), [decks, folderId])
  const rows = useMemo(() => flattenDecks(decks, expanded, folderId), [decks, expanded, folderId])

  return {
    view: {
      ready: foldersReady && decksReady,
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
    patchFolders,
    patchDecks,
  }
}
