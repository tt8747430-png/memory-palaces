import { useCallback, useEffect, useMemo } from 'react'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { deckPath, subtreeDeckIds, useMultiSelect } from '@/shared/lib'

export interface LibrarySelection {
  active: boolean
  ids: ReadonlySet<string>
  count: number
  allSelected: boolean
  deckIds: string[]
  decks: Deck[]
  begin: (id: string) => void
  toggle: (id: string) => void
  toggleAll: () => void
  exit: () => void
}

interface Args {
  decks: Deck[]
  folderIds: ReadonlySet<string>
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  folderId: string | null
}

/**
 * Library selection over the shared multi-select: a folder stands alone, while
 * touching a deck carries its whole top-level branch. Changing folder clears it.
 */
export function useLibrarySelection({
  decks,
  folderIds,
  sectionFolders,
  sectionDecks,
  folderId,
}: Args): LibrarySelection {
  const decksById = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])
  const subtree = useCallback(
    (id: string) => subtreeDeckIds(decks, id).filter((sid) => !decksById.get(sid)?.archived),
    [decks, decksById],
  )

  const expand = useCallback(
    (id: string): readonly string[] =>
      folderIds.has(id) ? [id] : subtree(deckPath(decks, id)[0]?.id ?? id),
    [folderIds, subtree, decks],
  )

  const selection = useMultiSelect({ expand })
  const { exit, setVisibleIds } = selection

  useEffect(() => exit(), [folderId, exit])

  const selectable = useMemo(() => {
    const all: string[] = []
    for (const folder of sectionFolders) all.push(folder.id)
    for (const deck of sectionDecks) for (const sid of subtree(deck.id)) all.push(sid)
    return all
  }, [sectionFolders, sectionDecks, subtree])

  useEffect(() => setVisibleIds(selectable), [selectable, setVisibleIds])

  const deckIds = useMemo(
    () => [...selection.ids].filter((id) => decksById.has(id)),
    [selection.ids, decksById],
  )
  const selectedDecks = useMemo(
    () => deckIds.map((id) => decksById.get(id)).filter((d): d is Deck => d !== undefined),
    [deckIds, decksById],
  )

  return {
    active: selection.active,
    ids: selection.ids,
    count: selection.count,
    allSelected: selection.allSelected,
    deckIds,
    decks: selectedDecks,
    begin: selection.begin,
    toggle: selection.toggle,
    toggleAll: selection.toggleAll,
    exit: selection.exit,
  }
}
