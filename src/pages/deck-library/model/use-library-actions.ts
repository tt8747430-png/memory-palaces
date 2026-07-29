import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Deck } from '@/entities/deck'
import { useDeckStoreApi } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { useFolderStoreApi } from '@/entities/folder'
import { useCardStoreApi } from '@/entities/card'
import {
  deleteDeck,
  duplicateDeck,
  moveDeck,
  reorderDecks,
  setDeckArchived,
  toggleDeckFavorite,
} from '@/features/deck'
import { deleteFolder, reorderFolders } from '@/features/folder'
import { canReparent, findEntity, orderPatch, siblingDecks, subtreeDeckIds } from '@/shared/lib'
import { bulkAction, type SelectActionHandlers } from '@/shared/ui'
import type { MoveDestination } from '../ui/MoveDeckSheet'
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
   * The one way decks change where they live. Every surface — a swipe, the move
   * sheet, a drop onto a folder, the select toolbar — comes through here, so the
   * subtree guard, the optimistic patch, the message and the undo are decided
   * once. Decks already at the destination are left alone, and a move that would
   * put a deck inside its own subtree is dropped rather than throwing.
   */
  const moveDecksTo = (ids: readonly string[], dest: MoveDestination) => {
    const moving = ids
      .map(deckById)
      .filter((deck): deck is Deck => deck !== undefined)
      .filter((deck) => (dest.kind === 'deck' ? canReparent(decks, deck.id, dest.deckId) : true))
      .filter((deck) => !alreadyAt(deck, dest))
    if (moving.length === 0) return

    const previous = moving.map((deck) => ({
      id: deck.id,
      parentId: deck.parentId,
      folderId: deck.folderId ?? null,
    }))
    const restore = undo(() =>
      previous.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
    )

    if (dest.kind === 'archive') {
      moving.forEach((deck) => void setDeckArchived(deckStore, deck.id, true))
      toast.success(archiveMessage(moving), {
        action: undo(() => moving.forEach((d) => void setDeckArchived(deckStore, d.id, false))),
      })
      return
    }

    const parentId = dest.kind === 'deck' ? dest.deckId : null
    const folderId = dest.kind === 'folder' ? dest.folderId : null

    // Land the rows where they will end up before the writes resolve, so a drop
    // onto a folder never shows the deck snapping back to its old row first.
    const base = siblingDecks(decks, parentId, folderId).length
    const patches = new Map<string, Partial<Deck>>()
    moving.forEach((deck, i) => patches.set(deck.id, { parentId, folderId, order: base + i }))
    patchDecks(patches)

    void (async () => {
      for (const deck of moving) await moveDeck(deckStore, deck.id, parentId, folderId)
    })()
    toast.success(moveMessage(moving, dest), { action: restore })
  }

  const alreadyAt = (deck: Deck, dest: MoveDestination): boolean => {
    switch (dest.kind) {
      case 'archive':
        return deck.archived
      case 'deck':
        return deck.parentId === dest.deckId
      case 'folder':
        return deck.parentId === null && deck.folderId === dest.folderId
      case 'home':
        return deck.parentId === null && (deck.folderId ?? null) === null
    }
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
    void deleteFolder(folderStore, deckStore, id)
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
    const ids = deckIds
    ids.forEach((id) => void duplicateDeck(deckStore, cardStore, id))
    toast.success(t('library.select.duplicatedToast', { count: ids.length }))
  }

  const filedDecks = selectedDecks.filter(
    (d) => d.parentId !== null || (d.folderId ?? null) !== null,
  )
  const bulkUnfile = () =>
    moveDecksTo(
      filedDecks.map((d) => d.id),
      { kind: 'home' },
    )

  const bulkMoveTo = (dest: MoveDestination) => {
    moveDecksTo(deckIds, dest)
    selection.exit()
  }

  const confirmBulkDelete = () => {
    const folderIds = [...selection.ids].filter((id) => folders.some((f) => f.id === id))
    folderIds.forEach((id) => void deleteFolder(folderStore, deckStore, id))
    deckIds.forEach((id) => void deleteDeck(deckStore, cardStore, id))
    if (folderId && folderIds.includes(folderId)) onFolderGone()
    selection.exit()
  }

  const noDecks = deckIds.length === 0
  const selectHandlers: SelectActionHandlers = {
    move: { onAction: onRequestBulkMove, disabled: noDecks },
    favorite: { ...bulkAction(selection, bulkFavorite), disabled: noDecks },
    duplicate: { ...bulkAction(selection, bulkDuplicate), disabled: noDecks },
    archive: { ...bulkAction(selection, bulkArchive), disabled: noDecks },
    unfile: { ...bulkAction(selection, bulkUnfile), disabled: filedDecks.length === 0 },
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
