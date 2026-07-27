import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { deckPath, impact, subtreeDeckIds } from '@/shared/lib'

export interface LibrarySelection {
  active: boolean
  ids: ReadonlySet<string>
  count: number
  allSelected: boolean
  deckIds: string[]
  decks: Deck[]
  beginFolder: (id: string) => void
  beginDeck: (id: string) => void
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

export function useLibrarySelection({
  decks,
  folderIds,
  sectionFolders,
  sectionDecks,
  folderId,
}: Args): LibrarySelection {
  const [active, setActive] = useState(false)
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    setActive(false)
    setIds(new Set())
  }, [folderId])

  const decksById = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])
  const subtree = useCallback(
    (id: string) => subtreeDeckIds(decks, id).filter((sid) => !decksById.get(sid)?.archived),
    [decks, decksById],
  )

  const beginFolder = useCallback((id: string) => {
    impact()
    setActive(true)
    setIds(new Set([id]))
  }, [])

  const beginDeck = useCallback(
    (id: string) => {
      impact()
      const top = deckPath(decks, id)[0]?.id ?? id
      setActive(true)
      setIds(new Set(subtree(top)))
    },
    [decks, subtree],
  )

  const toggleFolder = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleDeck = useCallback(
    (id: string) => {
      setIds((prev) => {
        const branch = subtree(id)
        const next = new Set(prev)
        if (branch.every((sid) => next.has(sid))) for (const sid of branch) next.delete(sid)
        else for (const sid of branch) next.add(sid)
        return next
      })
    },
    [subtree],
  )

  const toggle = useCallback(
    (id: string) => (folderIds.has(id) ? toggleFolder(id) : toggleDeck(id)),
    [folderIds, toggleFolder, toggleDeck],
  )

  const selectable = useMemo(() => {
    const all = new Set<string>()
    for (const folder of sectionFolders) all.add(folder.id)
    for (const deck of sectionDecks) for (const sid of subtree(deck.id)) all.add(sid)
    return all
  }, [sectionFolders, sectionDecks, subtree])

  const allSelected = selectable.size > 0 && [...selectable].every((id) => ids.has(id))
  const toggleAll = useCallback(
    () => setIds(allSelected ? new Set() : new Set(selectable)),
    [allSelected, selectable],
  )

  const exit = useCallback(() => {
    setActive(false)
    setIds(new Set())
  }, [])

  const deckIds = useMemo(() => [...ids].filter((id) => decksById.has(id)), [ids, decksById])
  const selectedDecks = useMemo(
    () => deckIds.map((id) => decksById.get(id)).filter((d): d is Deck => d !== undefined),
    [deckIds, decksById],
  )

  return {
    active,
    ids,
    count: ids.size,
    allSelected,
    deckIds,
    decks: selectedDecks,
    beginFolder,
    beginDeck,
    toggle,
    toggleAll,
    exit,
  }
}
