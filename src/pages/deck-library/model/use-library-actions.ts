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
import { canReparent, orderPatch, siblingDecks, subtreeDeckIds } from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'
import type { MoveDestination } from '../ui/MoveDeckSheet'
import type { LibrarySelection } from './use-library-selection'

type Patch<T> = (patches: Map<string, Partial<T>>) => void

interface Args {
  decks: Deck[]
  folders: Folder[]
  /** The folder this view is scoped to — deleting it means the route points at nothing. */
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
  /** The learner's configured select toolbar, wired to what a library selection can do. */
  selectHandlers: SelectActionHandlers
}

/**
 * Everything the library *does*, kept out of the view that decides when to do it. Each action
 * owns its own confirmation — the toast, the undo, and (for anything that moves rows) the
 * optimistic patch that holds the result on screen until the store agrees with it.
 */
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

  const deckById = (id: string) => decks.find((d) => d.id === id)
  const folderName = (id: string | null) =>
    id ? folders.find((f) => f.id === id)?.name : undefined
  const undo = (run: () => void) => ({ label: t('common.undo'), onClick: run })

  const archiveDeck = (deck: Deck) => {
    void setDeckArchived(deckStore, deck.id, true)
    toast.success(t('deck.archivedToast', { name: deck.name }), {
      action: undo(() => void setDeckArchived(deckStore, deck.id, false)),
    })
  }

  const duplicate = (deck: Deck) => {
    void duplicateDeck(deckStore, cardStore, deck.id)
    toast.success(t('deck.duplicatedToast', { name: deck.name }))
  }

  const toggleFavorite = (deck: Deck) => void toggleDeckFavorite(deckStore, deck.id)

  const moveDeckTo = (deck: Deck, dest: MoveDestination) => {
    if (dest.kind === 'archive') {
      archiveDeck(deck)
      return
    }
    const previous = { parentId: deck.parentId, folderId: deck.folderId ?? null }
    const action = undo(
      () => void moveDeck(deckStore, deck.id, previous.parentId, previous.folderId),
    )
    if (dest.kind === 'deck') {
      if (!canReparent(decks, deck.id, dest.deckId)) return
      void moveDeck(deckStore, deck.id, dest.deckId, null)
      toast.success(t('deck.movedIntoToast', { name: deckById(dest.deckId)?.name ?? '' }), {
        action,
      })
      return
    }
    const target = dest.kind === 'folder' ? dest.folderId : null
    void moveDeck(deckStore, deck.id, null, target)
    const name = folderName(target)
    toast.success(name ? t('deck.movedToast', { folder: name }) : t('deck.unfiledToast'), {
      action,
    })
  }

  const removeDeck = (deckId: string) => void deleteDeck(deckStore, cardStore, deckId)

  const removeFolder = (id: string) => {
    void deleteFolder(folderStore, deckStore, id)
    if (folderId === id) onFolderGone()
  }

  // Reordering persists as one write per row, so the store re-emits partial orders on the way to
  // the final one. Both handlers patch the new order on optimistically and hold it until the
  // stored rows agree, or the block settles row-by-row instead of all at once.
  const reorderFolderIds = (ids: string[]) => {
    patchFolders(orderPatch(ids))
    void reorderFolders(folderStore, ids)
  }

  const reorderDeckIds = (ids: string[]) => {
    patchDecks(orderPatch(ids))
    void reorderDecks(deckStore, ids)
  }

  /** Decks dropped onto a folder row: they leave this list and land at the end of that folder. */
  const fileDecksIntoFolder = (deckIds: string[], targetFolderId: string) => {
    const moving = deckIds.filter((id) => {
      const deck = deckById(id)
      return deck && !(deck.parentId === null && deck.folderId === targetFolderId)
    })
    if (moving.length === 0) return
    const base = siblingDecks(decks, null, targetFolderId).length
    const patches = new Map<string, Partial<Deck>>()
    moving.forEach((id, i) =>
      patches.set(id, { parentId: null, folderId: targetFolderId, order: base + i }),
    )
    patchDecks(patches)
    const previous = moving.map((id) => {
      const deck = deckById(id)!
      return { id, parentId: deck.parentId, folderId: deck.folderId ?? null }
    })
    void (async () => {
      for (const id of moving) await moveDeck(deckStore, id, null, targetFolderId)
    })()
    toast.success(
      t('library.select.movedToast', {
        count: moving.length,
        folder: folderName(targetFolderId) ?? '',
      }),
      {
        action: undo(() =>
          previous.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
        ),
      },
    )
  }

  // ---- Bulk, over the current selection ----
  const { deckIds, decks: selectedDecks, exit } = selection

  const bulkArchive = () => {
    const ids = deckIds
    ids.forEach((id) => void setDeckArchived(deckStore, id, true))
    toast.success(t('library.select.archivedToast', { count: ids.length }), {
      action: undo(() => ids.forEach((id) => void setDeckArchived(deckStore, id, false))),
    })
    exit()
  }

  // Favorite is a set, not a flip: a mixed selection favorites everything, and only an
  // all-favorited selection clears — so the tap always has one meaning.
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
    exit()
  }

  const bulkDuplicate = () => {
    const ids = deckIds
    ids.forEach((id) => void duplicateDeck(deckStore, cardStore, id))
    toast.success(t('library.select.duplicatedToast', { count: ids.length }))
    exit()
  }

  // "Unfile" lifts decks back out to the top level — out of a folder, out of a parent deck.
  // Decks already sitting there have nothing to lift.
  const filedDecks = selectedDecks.filter(
    (d) => d.parentId !== null || (d.folderId ?? null) !== null,
  )
  const bulkUnfile = () => {
    const moved = filedDecks.map((d) => ({
      id: d.id,
      parentId: d.parentId,
      folderId: d.folderId ?? null,
    }))
    moved.forEach((d) => void moveDeck(deckStore, d.id, null, null))
    toast.success(t('library.select.unfiledToast', { count: moved.length }), {
      action: undo(() =>
        moved.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
      ),
    })
    exit()
  }

  const bulkMoveTo = (dest: MoveDestination) => {
    const ids = deckIds
    if (dest.kind === 'archive') {
      ids.forEach((id) => void setDeckArchived(deckStore, id, true))
      toast.success(t('library.select.archivedToast', { count: ids.length }))
      exit()
      return
    }
    if (dest.kind === 'deck') {
      const valid = ids.filter((id) => canReparent(decks, id, dest.deckId))
      valid.forEach((id) => void moveDeck(deckStore, id, dest.deckId, null))
      toast.success(
        t('library.select.movedIntoToast', {
          count: valid.length,
          name: deckById(dest.deckId)?.name ?? '',
        }),
      )
      exit()
      return
    }
    const target = dest.kind === 'folder' ? dest.folderId : null
    ids.forEach((id) => void moveDeck(deckStore, id, null, target))
    const name = folderName(target)
    toast.success(
      name
        ? t('library.select.movedToast', { count: ids.length, folder: name })
        : t('library.select.unfiledToast', { count: ids.length }),
    )
    exit()
  }

  const confirmBulkDelete = () => {
    const folderIds = [...selection.ids].filter((id) => folders.some((f) => f.id === id))
    folderIds.forEach((id) => void deleteFolder(folderStore, deckStore, id))
    deckIds.forEach((id) => void deleteDeck(deckStore, cardStore, id))
    if (folderId && folderIds.includes(folderId)) onFolderGone()
    exit()
  }

  // Folder-only selections keep the deck-shaped actions visible but disabled, so the bar never
  // rearranges under the thumb.
  const noDecks = deckIds.length === 0
  const selectHandlers: SelectActionHandlers = {
    move: { onAction: onRequestBulkMove, disabled: noDecks },
    favorite: { onAction: bulkFavorite, disabled: noDecks },
    duplicate: { onAction: bulkDuplicate, disabled: noDecks },
    archive: { onAction: bulkArchive, disabled: noDecks },
    unfile: { onAction: bulkUnfile, disabled: filedDecks.length === 0 },
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

/** A deck can't be moved into itself or any of its own descendants. */
export function moveExclusions(decks: Deck[], targets: string[]): Set<string> {
  const ids = new Set<string>()
  for (const id of targets) for (const sub of subtreeDeckIds(decks, id)) ids.add(sub)
  return ids
}
