import { useEffect } from 'react'
import { usePendingAct } from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'
import type { MoveDestination } from '../ui/MoveDeckSheet'
import type { PendingAct } from './pending-act'
import { type LibraryActions, moveExclusions, useLibraryActions } from './use-library-actions'
import { type LibraryView, useLibraryData } from './use-library-data'

import { type LibrarySelection, useLibrarySelection } from './use-library-selection'

/** What the library screen reads, plus what it can do about it. */
export interface Library extends LibraryView {
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
  const view = data.view
  const pending = usePendingAct<PendingAct>()

  const missing = folderId !== null && data.foldersReady && !view.openFolder
  useEffect(() => {
    if (missing) onFolderGone()
  }, [missing, onFolderGone])

  const selection = useLibrarySelection({
    decks: view.decks,
    folderIds: data.folderIds,
    sectionFolders: view.sectionFolders,
    sectionDecks: view.sectionDecks,
    folderId,
  })

  const { selectHandlers, ...act } = useLibraryActions({
    decks: view.decks,
    folders: view.folders,
    folderId,
    selection,
    patchDecks: data.patchDecks,
    patchFolders: data.patchFolders,
    onFolderGone,
    onRequestBulkMove: () => pending.request({ kind: 'move-selection' }),
    onRequestBulkDelete: () => pending.request({ kind: 'delete-selection' }),
  })

  const confirm = (dest?: MoveDestination) =>
    pending.resolve((current) => {
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
    })

  return {
    ...view,
    selection,
    act,
    selectHandlers,
    pending: pending.act,
    request: pending.request,
    dismiss: pending.dismiss,
    confirm,
    moveExcludeIds: moveExclusions(view.decks, moveTargets(pending.act, selection.deckIds)),
  }
}
