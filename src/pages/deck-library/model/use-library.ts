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

  selection: LibrarySelection
  act: Omit<LibraryActions, 'selectHandlers'>
  selectHandlers: SelectActionHandlers

  pending: PendingAct | null
  request: (act: PendingAct) => void
  dismiss: () => void
  confirm: (dest?: MoveDestination) => void
  moveExcludeIds: ReadonlySet<string>
}

function moveTargets(pending: PendingAct | null, selectedDeckIds: string[]): string[] {
  if (pending?.kind === 'move-deck') return [pending.deck.id]
  if (pending?.kind === 'move-selection') return selectedDeckIds
  return []
}

export function useLibrary(folderId: string | null, onFolderGone: () => void): Library {
  const data = useLibraryData(folderId)
  const [pending, setPending] = useState<PendingAct | null>(null)

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
