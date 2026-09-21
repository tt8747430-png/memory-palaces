import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  type Deck,
  isAtLibraryTop,
  placeDecks,
  placeOf,
  standsAt,
  useDeckStoreApi,
} from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { useFolderStoreApi } from '@/entities/folder'
import { useCardStoreApi } from '@/entities/card'
import {
  archiveDecks,
  deleteDeck,
  duplicateDeck,
  moveDecks,
  reorderDecks,
  restoreDecks,
  toggleDeckFavorite,
} from '@/features/deck'
import { deleteFolder, reorderFolders, useDeleteFolderDeps } from '@/features/folder'
import {
  canReparent,
  findEntity,
  idsWithoutDescendants,
  orderPatch,
  subtreeDeckIds,
} from '@/shared/lib'
import { bulkAction, type SelectActionHandlers } from '@/shared/ui'
import { type Destination, placeOfDestination } from '@/widgets/deck-tree'
import type { LibrarySelection } from './use-library-selection'

type Patch<T> = (patches: Map<string, Partial<T>>) => void

interface Args {
  decks: Deck[]
  folders: Folder[]
  folderId: string | null
  selection: LibrarySelection
  patchDecks: Patch<Deck>
  patchFolders: Patch<Folder>
  onFolderGone: () => void
  /** Puts the Library back into the manual order, because a drag has just written one. */
  onManualOrder: () => void
  /** Opens the style sheet over the selection; the page owns that sheet. */
  onRequestBulkStyle: () => void
  onRequestBulkMove: () => void
  onRequestBulkDelete: () => void
}

export interface LibraryActions {
  archiveDeck: (deck: Deck) => void
  duplicate: (deck: Deck) => void
  toggleFavorite: (deck: Deck) => void
  moveDeckTo: (deck: Deck, dest: Destination) => void
  removeDeck: (deckId: string) => void
  removeFolder: (folderId: string) => void
  reorderFolderIds: (ids: string[]) => void
  reorderDeckIds: (ids: string[]) => void
  fileDecksIntoFolder: (deckIds: string[], targetFolderId: string) => void
  bulkMoveTo: (dest: Destination) => void
  confirmBulkDelete: () => void
  selectHandlers: SelectActionHandlers
}

export function useLibraryActions({
  decks,
  folders,
  folderId,
  selection,
  patchDecks,
  patchFolders,
  onFolderGone,
  onManualOrder,
  onRequestBulkStyle,
  onRequestBulkMove,
  onRequestBulkDelete,
}: Args): LibraryActions {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const cardStore = useCardStoreApi()
  const deleteDeps = useDeleteFolderDeps()

  const deckById = (id: string) => findEntity(decks, id)
  const folderName = (id: string | null) => findEntity(folders, id)?.name
  const undo = (run: () => void) => ({ label: t('common.undo'), onClick: run })

  const archiveDeck = (deck: Deck) => moveDecksTo([deck.id], { kind: 'archive' })

  const duplicate = (deck: Deck) => {
    void duplicateDeck(deckStore, cardStore, deck.id)
    toast.success(t('deck.duplicatedToast', { name: deck.name }))
  }

  const toggleFavorite = (deck: Deck) => void toggleDeckFavorite(deckStore, deck.id)

  const moveDecksTo = (ids: readonly string[], dest: Destination) => {
    const place = placeOfDestination(dest)
    const moving = idsWithoutDescendants(decks, ids)
      .map(deckById)
      .filter((deck): deck is Deck => deck !== undefined)
      .filter((deck) => place === null || canReparent(decks, deck.id, place.parentId))
      .filter((deck) => (place === null ? !deck.archived : !standsAt(deck, place)))
    if (moving.length === 0) return

    const previous = moving.map((deck) => ({ id: deck.id, from: placeOf(deck) }))

    if (place === null) {
      void archiveDecks(
        deckStore,
        moving.map((deck) => deck.id),
      )
      toast.success(archiveMessage(moving), {
        action: undo(() => void restoreDecks(deckStore, folderStore, previous)),
      })
      return
    }

    const moves = moving.map((deck) => ({ id: deck.id, to: place }))
    patchDecks(placeDecks(decks, moves))
    void moveDecks(deckStore, moves)
    toast.success(moveMessage(moving, dest), {
      action: undo(
        () =>
          void moveDecks(
            deckStore,
            previous.map(({ id, from }) => ({ id, to: from })),
          ),
      ),
    })
  }

  const archiveMessage = (moving: Deck[]): string =>
    moving.length === 1
      ? t('deck.archivedToast', { name: moving[0]!.name })
      : t('library.select.archivedToast', { count: moving.length })

  const moveMessage = (moving: Deck[], dest: Destination): string => {
    const one = moving.length === 1
    const count = moving.length
    if (dest.kind === 'deck') {
      const name = deckById(dest.deckId)?.name ?? ''
      return one
        ? t('deck.movedIntoToast', { name })
        : t('library.select.movedIntoToast', { count, name })
    }
    const folder = dest.kind === 'folder' ? folderName(dest.folderId) : undefined
    if (!folder) {
      return one ? t('deck.unfiledToast') : t('library.select.unfiledToast', { count })
    }
    return one
      ? t('deck.movedToast', { folder })
      : t('library.select.movedToast', { count, folder })
  }

  const moveDeckTo = (deck: Deck, dest: Destination) => moveDecksTo([deck.id], dest)

  const removeDeck = (deckId: string) => void deleteDeck(deleteDeps, deckId)

  const removeFolder = (id: string) => {
    void deleteFolder(deleteDeps, id)
    if (folderId === id) onFolderGone()
  }

  // A drag writes the manual order, so it is the manual order the Library must then be in —
  // otherwise the row springs back under the finger. The same rule the content editor uses.
  const reorderFolderIds = (ids: string[]) => {
    onManualOrder()
    patchFolders(orderPatch(ids))
    void reorderFolders(folderStore, ids)
  }

  const reorderDeckIds = (ids: string[]) => {
    onManualOrder()
    patchDecks(orderPatch(ids))
    void reorderDecks(deckStore, ids)
  }

  const fileDecksIntoFolder = (deckIds: string[], targetFolderId: string) =>
    moveDecksTo(deckIds, { kind: 'folder', folderId: targetFolderId })

  const { deckIds, decks: selectedDecks } = selection
  const carrierIds = idsWithoutDescendants(decks, deckIds)

  const bulkArchive = () => moveDecksTo(deckIds, { kind: 'archive' })

  const allFavorited = selectedDecks.length > 0 && selectedDecks.every((d) => d.favorite)
  const bulkFavorite = () => {
    const next = !allFavorited
    selectedDecks
      .filter((d) => Boolean(d.favorite) !== next)
      .forEach((d) => void toggleDeckFavorite(deckStore, d.id))
    toast.success(
      next
        ? t('library.select.favoritedToast', { count: selectedDecks.length })
        : t('library.select.unfavoritedToast', { count: selectedDecks.length }),
    )
  }

  const bulkDuplicate = () => {
    carrierIds.forEach((id) => void duplicateDeck(deckStore, cardStore, id))
    toast.success(t('library.select.duplicatedToast', { count: carrierIds.length }))
  }

  const filedIds = carrierIds.filter((id) => {
    const deck = deckById(id)
    return deck !== undefined && !isAtLibraryTop(deck)
  })
  const bulkUnfile = () => moveDecksTo(filedIds, { kind: 'home' })

  const bulkMoveTo = (dest: Destination) => {
    moveDecksTo(deckIds, dest)
    selection.exit()
  }

  const confirmBulkDelete = () => {
    const folderIds = [...selection.ids].filter((id) => folders.some((f) => f.id === id))
    folderIds.forEach((id) => void deleteFolder(deleteDeps, id))
    carrierIds.forEach((id) => void deleteDeck(deleteDeps, id))
    if (folderId && folderIds.includes(folderId)) onFolderGone()
    selection.exit()
  }

  const noDecks = deckIds.length === 0
  const selectHandlers: SelectActionHandlers = {
    move: { onAction: onRequestBulkMove, disabled: noDecks },
    favorite: { ...bulkAction(selection, bulkFavorite), disabled: noDecks },
    duplicate: { ...bulkAction(selection, bulkDuplicate), disabled: noDecks },
    archive: { ...bulkAction(selection, bulkArchive), disabled: noDecks },
    unfile: { ...bulkAction(selection, bulkUnfile), disabled: filedIds.length === 0 },
    style: { onAction: onRequestBulkStyle, disabled: noDecks },
    delete: { onAction: onRequestBulkDelete, disabled: selection.count === 0 },
  }

  return {
    archiveDeck,
    duplicate,
    toggleFavorite,
    moveDeckTo,
    removeDeck,
    removeFolder,
    reorderFolderIds,
    reorderDeckIds,
    fileDecksIntoFolder,
    bulkMoveTo,
    confirmBulkDelete,
    selectHandlers,
  }
}

export function moveExclusions(decks: Deck[], targets: string[]): Set<string> {
  const ids = new Set<string>()
  for (const id of targets) for (const sub of subtreeDeckIds(decks, id)) ids.add(sub)
  return ids
}
