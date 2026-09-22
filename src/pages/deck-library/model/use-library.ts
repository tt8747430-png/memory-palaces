import { useCallback, useEffect, useMemo, useState } from 'react'
import { selectSubdeckSorts, usePreferencesStoreApi } from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { type DeckSort, usePendingAct } from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'
import type { Destination } from '@/widgets/deck-tree'
import type { LibraryFilter } from './library-filter'
import type { PendingAct } from './pending-act'
import { type LibraryActions, moveExclusions, useLibraryActions } from './use-library-actions'
import { type LibraryView, useLibraryData } from './use-library-data'
import { type LibrarySelection, useLibrarySelection } from './use-library-selection'

export interface Library extends LibraryView {
  selection: LibrarySelection
  act: Omit<LibraryActions, 'selectHandlers'>
  selectHandlers: SelectActionHandlers

  pending: PendingAct | null
  request: (act: PendingAct) => void
  dismiss: () => void
  confirm: (dest?: Destination) => void
  moveExcludeIds: ReadonlySet<string>

  /** The order of the rows being looked at, and how to change it. */
  deckSort: DeckSort
  setDeckSort: (sort: DeckSort) => void
  /** The Library order reaches every subdeck; off while any deck's subdecks have their own. */
  allSubdecks: boolean
  setAllSubdecks: (on: boolean) => void
  canReorderDecks: boolean
  canReorderFolders: boolean
  /** Opens a selection over one deck's subdecks, so they can be ordered on their own. */
  sortSubdecks: (deckId: string) => void

  filter: LibraryFilter
  setFilter: (filter: LibraryFilter) => void
}

function moveTargets(pending: PendingAct | null, selectedDeckIds: string[]): string[] {
  if (pending?.kind === 'move-deck') return [pending.deck.id]
  if (pending?.kind === 'move-selection') return selectedDeckIds
  return []
}

export function useLibrary(folderId: string | null, onFolderGone: () => void): Library {
  const [scopeId, setScopeId] = useState<string | null>(null)
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const data = useLibraryData({ folderId, scopeId, filter })
  const view = data.view
  const pending = usePendingAct<PendingAct>()
  const prefStore = usePreferencesStoreApi()

  // The top level takes the Library order. One deck's subdecks take an order of their own — and
  // the moment they do, the Library order no longer reaches every subdeck, and the switch says so.
  const setDeckSort = useCallback(
    (sort: DeckSort) => {
      if (scopeId === null) {
        void setPreferences(prefStore, { deckSort: sort })
        return
      }
      const held = selectSubdeckSorts(prefStore.getState())
      void setPreferences(prefStore, {
        subdeckSorts: { ...held, [scopeId]: sort },
        deckSortSubdecks: false,
      })
    },
    [prefStore, scopeId],
  )
  const setAllSubdecks = useCallback(
    (on: boolean) =>
      void setPreferences(
        prefStore,
        on ? { deckSortSubdecks: true, subdeckSorts: {} } : { deckSortSubdecks: false },
      ),
    [prefStore],
  )

  const missing = folderId !== null && data.foldersReady && !view.openFolder
  useEffect(() => {
    if (missing) onFolderGone()
  }, [missing, onFolderGone])

  const held = useLibrarySelection({
    decks: view.decks,
    folderIds: data.folderIds,
    sectionFolders: view.sectionFolders,
    sectionDecks: view.sectionDecks,
    folderId,
    scoped: scopeId !== null,
  })
  // Leaving the selection leaves the scope and the filter with it: both were ways of looking at
  // the rows while choosing among them.
  const selection = useMemo<LibrarySelection>(
    () => ({
      ...held,
      exit: () => {
        held.exit()
        setScopeId(null)
        setFilter('all')
      },
    }),
    [held],
  )
  const sortSubdecks = useCallback(
    (deckId: string) => {
      setScopeId(deckId)
      held.enter()
    },
    [held],
  )

  const { selectHandlers, ...act } = useLibraryActions({
    decks: view.decks,
    folders: view.folders,
    folderId,
    selection,
    patchDecks: data.patchDecks,
    patchFolders: data.patchFolders,
    onFolderGone,
    onRequestBulkStyle: () => pending.request({ kind: 'style-selection' }),
    onRequestBulkMove: () => pending.request({ kind: 'move-selection' }),
    onRequestBulkDelete: () => pending.request({ kind: 'delete-selection' }),
  })

  const confirm = (dest?: Destination) =>
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
          return
        case 'style-selection':
          // The sheet applies the style itself; confirming only closes it.
          return
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
    deckSort: data.deckSort,
    setDeckSort,
    allSubdecks: data.allSubdecks,
    setAllSubdecks,
    canReorderDecks: data.canReorderDecks,
    canReorderFolders: data.canReorderFolders,
    sortSubdecks,
    filter,
    setFilter,
  }
}
