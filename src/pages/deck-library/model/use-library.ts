import { useEffect, useState } from 'react'
import type { Card } from '@/entities/card'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import type { FlatDeck } from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'
import type { MoveDestination } from '../ui/MoveDeckSheet'
import type { PendingAct } from './pending-act'
import { type LibraryActions, moveExclusions, useLibraryActions } from './use-library-actions'
import { useLibraryData } from './use-library-data'
import { type LibrarySelection, useLibrarySelection } from './use-library-selection'

export interface Library {
  ready: boolean
  isEmpty: boolean
  /** Every folder, in order. Empty of meaning inside a folder — folders don't nest. */
  folders: Folder[]
  decks: Deck[]
  cards: Card[]
  /** The folder this view is scoped to, once the store has emitted it. */
  openFolder: Folder | undefined
  folderDeckCounts: Map<string, number>
  /** The rows select mode shows: this scope's folders, then its top-level decks. */
  sectionFolders: Folder[]
  sectionDecks: Deck[]
  /** The browse tree: this scope's decks, nested, descending only into what is expanded. */
  rows: FlatDeck[]
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void

  selection: LibrarySelection
  /** Acts that run immediately. Anything needing confirmation goes through `request`. */
  act: Omit<LibraryActions, 'selectHandlers'>
  /** The configured select toolbar, wired to what this selection can do. */
  selectHandlers: SelectActionHandlers

  /** The one act awaiting the learner: a confirmation, or a destination to move to. */
  pending: PendingAct | null
  request: (act: PendingAct) => void
  dismiss: () => void
  /** Carry out `pending` — for the two deletes and the two moves alike. */
  confirm: (dest?: MoveDestination) => void
  /** Decks a move may not land in: itself and its own descendants. */
  moveExcludeIds: ReadonlySet<string>
}

/** Which decks a pending move is about — one, the whole selection, or none. */
function moveTargets(pending: PendingAct | null, selectedDeckIds: string[]): string[] {
  if (pending?.kind === 'move-deck') return [pending.deck.id]
  if (pending?.kind === 'move-selection') return selectedDeckIds
  return []
}

/**
 * The deck library as one module: what it shows, what is selected, what it can do, and what it
 * is waiting to be told. The page reads this and nothing else.
 *
 * Composed from three internal parts — the stores and their derivations, the selection, and the
 * commands — which are seams for this module's own tests, not for its caller. In particular the
 * optimistic overlay that holds a drop on screen never surfaces: the page does not know a drop
 * is persisted as several writes, only that reordering is something the library does.
 */
export function useLibrary(folderId: string | null, onFolderGone: () => void): Library {
  const data = useLibraryData(folderId)
  const [pending, setPending] = useState<PendingAct | null>(null)

  // Once the folders are in and this one isn't among them, the route is pointing at nothing —
  // deleted from inside it, or a stale link.
  const missing = folderId !== null && data.foldersReady && !data.openFolder
  useEffect(() => {
    if (missing) onFolderGone()
  }, [missing, onFolderGone])

  const selection = useLibrarySelection({
    decks: data.decks,
    folderIds: data.folderIds,
    sectionFolders: data.sectionFolders,
    sectionDecks: data.sectionDecks,
    folderId,
  })

  const { selectHandlers, ...act } = useLibraryActions({
    decks: data.decks,
    folders: data.folders,
    folderId,
    selection,
    patchDecks: data.patchDecks,
    patchFolders: data.patchFolders,
    onFolderGone,
    onRequestBulkMove: () => setPending({ kind: 'move-selection' }),
    onRequestBulkDelete: () => setPending({ kind: 'delete-selection' }),
  })

  const dismiss = () => setPending(null)

  const confirm = (dest?: MoveDestination) => {
    const current = pending
    setPending(null)
    if (!current) return
    switch (current.kind) {
      case 'move-deck':
        if (dest) act.moveDeckTo(current.deck, dest)
        return
      case 'move-selection':
        if (dest) act.bulkMoveTo(dest)
        return
      case 'delete-deck':
        act.removeDeck(current.deck.id)
        return
      case 'delete-folder':
        act.removeFolder(current.folder.id)
        return
      case 'delete-selection':
        act.confirmBulkDelete()
    }
  }

  return {
    ready: data.ready,
    isEmpty: data.isEmpty,
    folders: data.sortedFolders,
    decks: data.decks,
    cards: data.cards,
    openFolder: data.openFolder,
    folderDeckCounts: data.folderDeckCounts,
    sectionFolders: data.sectionFolders,
    sectionDecks: data.sectionDecks,
    rows: data.rows,
    expanded: data.expanded,
    toggleExpanded: data.toggleExpanded,
    expand: data.expand,
    selection,
    act,
    selectHandlers,
    pending,
    request: setPending,
    dismiss,
    confirm,
    moveExcludeIds: moveExclusions(data.decks, moveTargets(pending, selection.deckIds)),
  }
}
