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
import { deleteFolder, reorderFolders } from '@/features/folder'
import {
  canReparent,
  findEntity,
  idsWithoutDescendants,
  orderPatch,
  subtreeDeckIds,
} from '@/shared/lib'
import { bulkAction, type SelectActionHandlers } from '@/shared/ui'
import { type MoveDestination, placeOfDestination } from '@/widgets/deck-tree'
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
  onRequestBulkMove: () => void
  onRequestBulkDelete: () => void
}

export interface LibraryActions {
  archiveDeck: (deck: Deck) => void
  duplicate: (deck: Deck) => void
  toggleFavorite: (deck: Deck) => void
  moveDeckTo: (deck: Deck, dest: MoveDestination) => void
  removeDeck: (deckId: string) => void
  removeFolder: (folderId: string) => void
  reorderFolderIds: (ids: string[]) => void
  reorderDeckIds: (ids: string[]) => void
  fileDecksIntoFolder: (deckIds: string[], targetFolderId: string) => void
  bulkMoveTo: (dest: MoveDestination) => void
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
  onRequestBulkMove,
  onRequestBulkDelete,
}: Args): LibraryActions {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const cardStore = useCardStoreApi()

  const deckById = (id: string) => findEntity(decks, id)
  const folderName = (id: string | null) => findEntity(folders, id)?.name
  const undo = (run: () => void) => ({ label: t('common.undo'), onClick: run })

  const archiveDeck = (deck: Deck) => moveDecksTo([deck.id], { kind: 'archive' })

  const duplicate = (deck: Deck) => {
    void duplicateDeck(deckStore, cardStore, deck.id)
    toast.success(t('deck.duplicatedToast', { name: deck.name }))
  }

  const toggleFavorite = (deck: Deck) => void toggleDeckFavorite(deckStore, deck.id)

  /**
   * The one way decks change where they live. Every surface — swipe, move sheet, drop onto a
   * folder, select toolbar — comes through here, so the subtree guard, optimistic patch, message
   * and undo are decided once. A selection carries each deck with its subdecks, so only the decks
   * no ancestor carries are moved; the rest come along under them. Decks already at the destination
   * are left alone; a move that would put a deck inside its own subtree is dropped, not thrown.
   */
  const moveDecksTo = (ids: readonly string[], dest: MoveDestination) => {
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
    // Land the rows where they end up before the writes resolve, so a drop onto a folder never
    // shows the deck snapping back to its old row first. The patch is the very placement the
    // command writes, so the held rows and the persisted ones agree to the order.
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

  /** One deck is named; a batch is counted. */
  const archiveMessage = (moving: Deck[]): string =>
    moving.length === 1
      ? t('deck.archivedToast', { name: moving[0]!.name })
      : t('library.select.archivedToast', { count: moving.length })

  const moveMessage = (moving: Deck[], dest: MoveDestination): string => {
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

  const moveDeckTo = (deck: Deck, dest: MoveDestination) => moveDecksTo([deck.id], dest)

  const removeDeck = (deckId: string) => void deleteDeck(deckStore, cardStore, deckId)

  const removeFolder = (id: string) => {
    void deleteFolder(folderStore, deckStore, cardStore, id)
    if (folderId === id) onFolderGone()
  }

  const reorderFolderIds = (ids: string[]) => {
    patchFolders(orderPatch(ids))
    void reorderFolders(folderStore, ids)
  }

  const reorderDeckIds = (ids: string[]) => {
    patchDecks(orderPatch(ids))
    void reorderDecks(deckStore, ids)
  }

  const fileDecksIntoFolder = (deckIds: string[], targetFolderId: string) =>
    moveDecksTo(deckIds, { kind: 'folder', folderId: targetFolderId })

  const { deckIds, decks: selectedDecks } = selection
  /** The selected decks no selected ancestor carries — what acts on a deck with its subdecks. */
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

  // `duplicateDeck` copies a subtree, so a subdeck duplicated on its own as well would be a second
  // copy standing beside its parent's.
  const bulkDuplicate = () => {
    carrierIds.forEach((id) => void duplicateDeck(deckStore, cardStore, id))
    toast.success(t('library.select.duplicatedToast', { count: carrierIds.length }))
  }

  const filedIds = carrierIds.filter((id) => {
    const deck = deckById(id)
    return deck !== undefined && !isAtLibraryTop(deck)
  })
  const bulkUnfile = () => moveDecksTo(filedIds, { kind: 'home' })

  const bulkMoveTo = (dest: MoveDestination) => {
    moveDecksTo(deckIds, dest)
    selection.exit()
  }

  const confirmBulkDelete = () => {
    const folderIds = [...selection.ids].filter((id) => folders.some((f) => f.id === id))
    folderIds.forEach((id) => void deleteFolder(folderStore, deckStore, cardStore, id))
    carrierIds.forEach((id) => void deleteDeck(deckStore, cardStore, id))
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
