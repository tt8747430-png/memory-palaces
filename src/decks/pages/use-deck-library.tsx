import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  pointerWithin,
} from '@dnd-kit/core'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createDeck,
  createFolder,
  createSubdeck,
  type Deck,
  DECK_COLOR_OPTIONS,
  deleteDeck,
  deleteDecks,
  deleteFolder,
  deleteFolders,
  duplicateDeck,
  duplicateDecks,
  editFolder,
  type Folder,
  moveDeck,
  moveDecks,
  reorderDecks,
  reorderFolders,
  setDeckArchived,
  setDecksArchived,
  setDecksFavorite,
  toggleDeckFavorite,
} from '@/decks'
import { openFolderDrawer, openMoveDeckDrawer, type MoveDestination } from '@/decks/ui'
import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'
import {
  canReparent,
  dayKey,
  type DropIntent,
  dropZone,
  dueCountsPerDeck,
  impact,
  nextDefaultName,
  siblingDecks,
  subtreeDeckIds,
  tick,
} from '@/shared/domain'
import {
  orderPatch,
  useNow,
  useOptimisticPatch,
  useSortableSensors,
  useStickyHeader,
} from '@/shared/lib'
import { openActionDrawer, openConfirmDialog, openPromptDrawer } from '@/shared/ui'
import type { SwipeActionHandlers } from '@/shared/ui'

export interface DeckLibraryPageProps {
  onOpenDeck: (deckId: string) => void
  onOpenDeckSettings?: (deckId: string) => void
  onImportPaste?: () => void
  onReviewDeck?: (deckId: string) => void
  onOpenProfile?: () => void
  onOpenNotifications?: () => void
  onOpenStreak?: () => void
  onOpenArchived?: () => void
}

/** How long the drag overlay takes to land on the row it was dropped onto. */
export const DROP_MS = 220

/** The finger's y, straight from the event — never inferred from the drag delta,
 *  which drifts away from the finger the moment the list auto-scrolls under it. */
function pointerYFrom(event: Event): number | null {
  if (event instanceof MouseEvent) return event.clientY
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
    const touch = event.touches[0] ?? event.changedTouches[0]
    if (touch) return touch.clientY
  }
  return null
}

function insertAt(ids: string[], id: string, at: number): string[] {
  return [...ids.slice(0, at), id, ...ids.slice(at)]
}

export interface DeckLibraryBulkActions {
  move: () => Promise<void>
  favorite: () => void
  duplicate: () => void
  archive: () => void
  unfile: () => void
  delete: () => Promise<void>
}

/**
 * `DeckLibraryPage`'s ViewModel. Earned (A.7): it owns the derived deck-tree read model, the
 * whole drag-reorder/reparent orchestration (`onDragStart/Move/Over/End` → optimistic patch →
 * `reorderDecks`/`reorderFolders`/`moveDeck(s)`), multi-select + bulk commands, and the sequenced
 * overlay flows (prompt → command → toast-with-undo) that `main` drove with ~15 `useState`s and a
 * fistful of controlled Sheet/Dialog components. Every one of those controlled-overlay states
 * (`createPrompt`, `folderSheetTarget`, `folderMenuOpen`, `moveTarget`, `pendingDeleteDeck`,
 * `pendingDeleteFolder`, `bulkMoveOpen`, `bulkDeleteOpen`) collapses here because the overlays this
 * repo already ported (`openPromptDrawer`, `openFolderDrawer`, `openMoveDeckDrawer`,
 * `openConfirmDialog`, `openActionDrawer`) are promise-returning: the orchestration just awaits
 * them in sequence instead of toggling `open` flags. `DeckLibraryPage` (the View) renders off this.
 *
 * Handlers below are plain functions, redefined each render — matching `main`'s own choice (it
 * wraps only `deckById`, `collisionDetection`, `settle` and `dropIntentFor` in `useCallback`;
 * everything else is a plain closure). None of these are hot paths or effect dependencies, so
 * memoizing them would add stale-closure risk for no measurable benefit (CODE_STYLE.md §7).
 */
export function useDeckLibrary(props: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const stickyHeader = useStickyHeader()
  const {
    deckStore,
    folderStore,
    cardStore,
    profileStore,
    progressStore,
    preferencesStore,
    notificationStore,
    sessionStore,
  } = useServices()

  const storeFolders = useStore(folderStore.folders)
  const storeDecks = useStore(deckStore.decks)
  const cards = useStore(cardStore.cards)
  const foldersReady = useStore(folderStore.status) === 'ready'
  const decksReady = useStore(deckStore.status) === 'ready'
  const ready = foldersReady && decksReady

  // A drop shows up instantly and stays put: the new order and parent are held
  // over the store's emissions until the persisted rows agree with them.
  const [folders, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  const session = useStore(sessionStore.session)
  const profile = useStore(profileStore.effective)
  const progress = useStore(progressStore.progress)
  const prefs = useStore(preferencesStore.effective)
  const unreadCount = useStore(notificationStore.unreadCount)

  // `main` re-reads `Date.now()` every render so due badges and the streak ring self-heal.
  // `react-hooks/purity` forbids that here, so the clock ticks instead — freezing it at mount
  // would leave a backgrounded PWA (which never unmounts) stale indefinitely.
  const now = useNow()

  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const today = dayKey(now)
  const dayCount = progress?.activeDayKey === today ? progress.activeDayCount : 0

  const [folderId, setFolderId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())

  // Leaving or entering a folder ends any in-progress selection. `main` does this with
  // `useEffect(() => resetSelection, [folderId])`; this repo's `react-hooks/set-state-in-effect`
  // rule (absent from main's looser config, same story as `DeckTree`'s `now`) forbids setState
  // inside an effect body, so this adjusts state during render instead — the pattern React's own
  // docs recommend for "resetting state when a prop changes" (no effect, no extra render commit).
  const [selectResetKey, setSelectResetKey] = useState(folderId)
  if (folderId !== selectResetKey) {
    setSelectResetKey(folderId)
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const openFolder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])
  const inFolder = openFolder != null

  const decksById = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])
  const deckById = useCallback((id: string) => decksById.get(id), [decksById])

  const rootDeckCount = useMemo(
    () => decks.filter((d) => d.parentId === null && d.folderId === null && !d.archived).length,
    [decks],
  )
  const folderDeckCount = useMemo(
    () => decks.filter((d) => d.parentId === null && d.folderId === folderId && !d.archived).length,
    [decks, folderId],
  )
  const folderDeckCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of decks) {
      if (d.parentId === null && d.folderId && !d.archived) {
        counts.set(d.folderId, (counts.get(d.folderId) ?? 0) + 1)
      }
    }
    return counts
  }, [decks])
  const rootEmpty = sortedFolders.length === 0 && rootDeckCount === 0
  const isEmpty = inFolder ? folderDeckCount === 0 : rootEmpty
  // The card in hand shows the same due badge the row does.
  const dragDueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])

  // ---- Folder create/edit — promise-returning drawer, no local target state ----
  const createFolderPrompt = async () => {
    const nextColor = DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value
    const defaultName = nextDefaultName(
      t('folder.baseName'),
      folders.map((f) => f.name),
    )
    const draft = await openFolderDrawer({ defaultColor: nextColor, defaultName })
    if (!draft) return
    void createFolder(folderStore, draft)
    if (inFolder) setFolderId(null)
  }

  const editFolderPrompt = async (folder: Folder) => {
    const draft = await openFolderDrawer({ folder })
    if (draft) void editFolder(folderStore, folder, draft)
  }

  // ---- Deck / subdeck create ----
  const createDeckPrompt = async (targetFolderId: string | null) => {
    const siblings = decks
      .filter((d) => d.parentId === null && (d.folderId ?? null) === (targetFolderId ?? null))
      .map((d) => d.name)
    const initialValue = nextDefaultName(t('deck.baseDeckName'), siblings)
    const deckName = await openPromptDrawer({
      title: t('deck.newDeck'),
      label: t('deck.nameLabel'),
      placeholder: t('deck.namePlaceholder'),
      initialValue,
      confirmLabel: t('deck.create'),
    })
    if (deckName) void createDeck(deckStore, { name: deckName, folderId: targetFolderId })
  }

  const createSubdeckPrompt = async (parent: Deck) => {
    const siblings = decks.filter((d) => d.parentId === parent.id).map((d) => d.name)
    const initialValue = nextDefaultName(t('deck.baseSubdeckName'), siblings)
    const subdeckName = await openPromptDrawer({
      title: t('deck.newSubdeck'),
      description: t('deck.subdeckOf', { name: parent.name }),
      label: t('deck.nameLabel'),
      placeholder: t('deck.namePlaceholder'),
      initialValue,
      confirmLabel: t('deck.create'),
    })
    if (!subdeckName) return
    void createSubdeck(deckStore, parent.id, { name: subdeckName })
    setExpanded((prev) => new Set(prev).add(parent.id))
  }

  const openFolderMenu = async (folder: Folder) => {
    const choice = await openActionDrawer({
      title: folder.name,
      actions: [
        {
          id: 'settings',
          label: t('folder.settings'),
          icon: <Settings className="size-5" aria-hidden />,
        },
        {
          id: 'add-deck',
          label: t('folder.addDeck'),
          icon: <Plus className="size-5" aria-hidden />,
        },
        {
          id: 'delete',
          label: t('common.delete'),
          icon: <Trash2 className="size-5" aria-hidden />,
          tone: 'danger',
        },
      ],
    })
    if (choice === 'settings') await editFolderPrompt(folder)
    else if (choice === 'add-deck') await createDeckPrompt(folder.id)
    else if (choice === 'delete') await confirmDeleteFolder(folder)
  }

  // ---- Single-deck actions ----
  const archiveDeck = (deck: Deck) => {
    void setDeckArchived(deckStore, deck.id, true)
    toast.success(t('deck.archivedToast', { name: deck.name }), {
      action: {
        label: t('common.undo'),
        onClick: () => void setDeckArchived(deckStore, deck.id, false),
      },
    })
  }

  const duplicate = (deck: Deck) => {
    void duplicateDeck(deckStore, cardStore, deck.id)
    toast.success(t('deck.duplicatedToast', { name: deck.name }))
  }

  const pickMoveDestination = async (
    subtitle: string,
    excludeIds: ReadonlySet<string>,
  ): Promise<MoveDestination | null> =>
    openMoveDeckDrawer({
      decks,
      folders: sortedFolders,
      subtitle,
      excludeIds,
      onNewFolder: () => void createFolderPrompt(),
    })

  const moveDeckPrompt = async (deck: Deck) => {
    const dest = await pickMoveDestination(deck.name, new Set(subtreeDeckIds(decks, deck.id)))
    if (!dest) return
    if (dest.kind === 'archive') {
      archiveDeck(deck)
      return
    }
    const previous = { parentId: deck.parentId, folderId: deck.folderId ?? null }
    const undo = {
      label: t('common.undo'),
      onClick: () => void moveDeck(deckStore, deck.id, previous.parentId, previous.folderId),
    }
    if (dest.kind === 'deck') {
      if (!canReparent(decks, deck.id, dest.deckId)) return
      void moveDeck(deckStore, deck.id, dest.deckId, null)
      toast.success(t('deck.movedIntoToast', { name: deckById(dest.deckId)?.name ?? '' }), {
        action: undo,
      })
      return
    }
    const targetFolderId = dest.kind === 'folder' ? dest.folderId : null
    void moveDeck(deckStore, deck.id, null, targetFolderId)
    const folderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name
      : undefined
    toast.success(
      folderName ? t('deck.movedToast', { folder: folderName }) : t('deck.unfiledToast'),
      {
        action: undo,
      },
    )
  }

  const confirmDeleteDeck = async (deck: Deck) => {
    const ok = await openConfirmDialog({
      title: t('deck.deleteTitle', { name: deck.name }),
      description: t('deck.deleteBody'),
      confirmLabel: t('deck.confirmDelete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (ok) void deleteDeck(deckStore, cardStore, deck.id)
  }

  const confirmDeleteFolder = async (folder: Folder) => {
    const ok = await openConfirmDialog({
      title: t('folder.deleteTitle', { name: folder.name }),
      description: t('folder.deleteBody'),
      confirmLabel: t('folder.confirmDelete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    void deleteFolder(folderStore, deckStore, folder.id)
    setFolderId((current) => (current === folder.id ? null : current))
  }

  // ---- Multi-select (long-press) ----
  const enterSelect = (id: string) => {
    impact()
    setSelectMode(true)
    setSelectedIds(new Set([id]))
  }
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  // Every selectable id in the current view (folders at root + the whole deck tree).
  const selectableIds = useMemo(() => {
    const ids = new Set<string>()
    if (!inFolder) for (const f of sortedFolders) ids.add(f.id)
    const stack = decks
      .filter(
        (d) => d.parentId === null && (d.folderId ?? null) === (folderId ?? null) && !d.archived,
      )
      .map((d) => d.id)
    while (stack.length) {
      const id = stack.pop()!
      ids.add(id)
      for (const c of decks) if (c.parentId === id) stack.push(c.id)
    }
    return ids
  }, [decks, folderId, inFolder, sortedFolders])

  const selectedCount = selectedIds.size
  const selectedDeckIds = useMemo(
    () => [...selectedIds].filter((id) => decks.some((d) => d.id === id)),
    [selectedIds, decks],
  )
  const selectedDecks = useMemo(
    () => selectedDeckIds.map((id) => deckById(id)).filter((d): d is Deck => d !== undefined),
    [selectedDeckIds, deckById],
  )

  // A deck can't be moved into itself or any of its own descendants.
  const moveExcludeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const id of selectedDeckIds) for (const sub of subtreeDeckIds(decks, id)) ids.add(sub)
    return ids
  }, [selectedDeckIds, decks])
  const allSelected =
    selectableIds.size > 0 && [...selectableIds].every((id) => selectedIds.has(id))
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(selectableIds))

  // "Unfile" lifts decks back out to the top level — out of a folder, out of a
  // parent deck. Decks already sitting there have nothing to lift.
  const filedDecks = selectedDecks.filter(
    (d) => d.parentId !== null || (d.folderId ?? null) !== null,
  )

  const bulkMove = async () => {
    const ids = selectedDeckIds
    const dest = await pickMoveDestination(
      t('library.select.count', { count: ids.length }),
      moveExcludeIds,
    )
    if (!dest) return
    if (dest.kind === 'archive') {
      void setDecksArchived(deckStore, ids, true)
      toast.success(t('library.select.archivedToast', { count: ids.length }))
      exitSelect()
      return
    }
    const parentId = dest.kind === 'deck' ? dest.deckId : null
    const targetFolderId = dest.kind === 'folder' ? dest.folderId : null
    void moveDecks(deckStore, ids, parentId, targetFolderId).then((moved) => {
      if (dest.kind === 'deck') {
        toast.success(
          t('library.select.movedIntoToast', {
            count: moved.length,
            name: deckById(parentId as string)?.name ?? '',
          }),
        )
        return
      }
      const folderName = targetFolderId
        ? folders.find((f) => f.id === targetFolderId)?.name
        : undefined
      toast.success(
        folderName
          ? t('library.select.movedToast', { count: moved.length, folder: folderName })
          : t('library.select.unfiledToast', { count: moved.length }),
      )
    })
    exitSelect()
  }

  const bulkFavorite = () => {
    const allFavorited = selectedDecks.length > 0 && selectedDecks.every((d) => d.favorite)
    const next = !allFavorited
    void setDecksFavorite(deckStore, selectedDeckIds)
    toast.success(
      next
        ? t('library.select.favoritedToast', { count: selectedDecks.length })
        : t('library.select.unfavoritedToast', { count: selectedDecks.length }),
    )
    exitSelect()
  }

  const bulkDuplicate = () => {
    const ids = selectedDeckIds
    void duplicateDecks(deckStore, cardStore, ids)
    toast.success(t('library.select.duplicatedToast', { count: ids.length }))
    exitSelect()
  }

  const bulkArchive = () => {
    const ids = selectedDeckIds
    void setDecksArchived(deckStore, ids, true)
    toast.success(t('library.select.archivedToast', { count: ids.length }), {
      action: {
        label: t('common.undo'),
        onClick: () => void setDecksArchived(deckStore, ids, false),
      },
    })
    exitSelect()
  }

  const bulkUnfile = () => {
    const moved = filedDecks.map((d) => ({
      id: d.id,
      parentId: d.parentId,
      folderId: d.folderId ?? null,
    }))
    void moveDecks(
      deckStore,
      moved.map((d) => d.id),
      null,
      null,
    )
    toast.success(t('library.select.unfiledToast', { count: moved.length }), {
      action: {
        label: t('common.undo'),
        onClick: () => moved.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
      },
    })
    exitSelect()
  }

  const bulkDelete = async () => {
    const ok = await openConfirmDialog({
      title: t('library.select.deleteTitle', { count: selectedCount }),
      description: t('library.select.deleteBody'),
      confirmLabel: t('deck.confirmDelete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    const folderIds = [...selectedIds].filter((id) => folders.some((f) => f.id === id))
    const deckIds = [...selectedIds].filter((id) => decks.some((d) => d.id === id))
    void deleteFolders(folderStore, deckStore, folderIds)
    void deleteDecks(deckStore, cardStore, deckIds)
    setFolderId((current) => (current && folderIds.includes(current) ? null : current))
    exitSelect()
  }

  const bulk: DeckLibraryBulkActions = {
    move: bulkMove,
    favorite: bulkFavorite,
    duplicate: bulkDuplicate,
    archive: bulkArchive,
    unfile: bulkUnfile,
    delete: bulkDelete,
  }

  // ---- Drag: reorder + reparent (select mode) ----
  const dndSensors = useSortableSensors()
  /**
   * The row under the finger wins. The drop zone is read off the pointer, so the
   * row it is read against has to be the one the pointer is actually inside —
   * rect-centre proximity would hand back a neighbour and make the zones lie.
   * In the seams between rows nothing contains the pointer, so the nearest row
   * takes over and resolves to its near edge.
   *
   * A dragged folder only ever targets folders: it can't nest into a deck, and
   * it can't be ordered among them.
   */
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const activeId = String(args.active.id)
      const scoped = folders.some((f) => f.id === activeId)
        ? {
            ...args,
            droppableContainers: args.droppableContainers.filter((c) =>
              folders.some((f) => f.id === c.id),
            ),
          }
        : args
      const under = pointerWithin(scoped)
      return under.length > 0 ? under : closestCenter(scoped)
    },
    [folders],
  )
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [drop, setDrop] = useState<DropIntent | null>(null)
  const pointerY = useRef<number | null>(null)

  // The tree holds still until the dropped card has finished landing on it —
  // see `quiet` in DeckTreeNode for why an entrance animation mid-landing reads
  // as a flicker.
  const [settling, setSettling] = useState(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settle = useCallback(() => {
    setSettling(true)
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => setSettling(false), DROP_MS + 60)
  }, [])
  useEffect(() => () => void (settleTimer.current && clearTimeout(settleTimer.current)), [])

  // The pointer is followed for the length of the drag, because the drop zone is
  // a question about where the *finger* is, not where the card has been carried.
  useEffect(() => {
    if (!activeDragId) return
    const track = (event: Event) => {
      const y = pointerYFrom(event)
      if (y != null) pointerY.current = y
    }
    window.addEventListener('pointermove', track, { passive: true })
    window.addEventListener('touchmove', track, { passive: true })
    return () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('touchmove', track)
    }
  }, [activeDragId])
  const activeDragDeck = activeDragId ? deckById(activeDragId) : undefined
  const activeDragFolder = activeDragId ? folders.find((f) => f.id === activeDragId) : undefined

  /**
   * What the drop would do, read off where the finger actually is.
   *
   * The middle of a row means "into this row"; its top and bottom edges mean
   * "between these rows". Nothing is hidden in a modifier gesture, and nothing
   * is inferred from which branch the target happens to live in — the same hover
   * always means the same thing, and the tree says which by ringing the row or
   * drawing a line in the seam.
   */
  const dropIntentFor = useCallback(
    (event: DragMoveEvent | DragOverEvent | DragEndEvent): DropIntent | null => {
      const { active, over } = event
      if (!over) return null
      const draggedId = String(active.id)
      const targetId = String(over.id)
      if (draggedId === targetId) return null

      // A keyboard drag has no pointer — the card's own centre stands in for one.
      const rect = event.active.rect.current.translated
      const y = pointerY.current ?? (rect ? rect.top + rect.height / 2 : null)
      if (y == null) return null

      const draggedFolder = folders.find((f) => f.id === draggedId)
      const targetFolder = folders.find((f) => f.id === targetId)

      // A folder holds decks, never folders: dragging one can only reorder it.
      if (draggedFolder) {
        if (!targetFolder) return null
        return { targetId, zone: dropZone(y, over.rect, false) }
      }

      const dragged = deckById(draggedId)
      if (!dragged) return null

      // A deck can't be ordered among folders — a folder row can only take it in.
      if (targetFolder) {
        const alreadyThere = dragged.parentId === null && dragged.folderId === targetFolder.id
        return alreadyThere ? null : { targetId, zone: 'nest' }
      }

      const target = deckById(targetId)
      if (!target) return null

      const zone = dropZone(y, over.rect, canReparent(decks, draggedId, targetId))
      // Landing beside a row means joining *its* group — which is a cycle if that
      // group lives inside the deck being dragged.
      if (zone !== 'nest' && !canReparent(decks, draggedId, target.parentId)) return null
      return { targetId, zone }
    },
    [decks, folders, deckById],
  )

  const trackDropIntent = (event: DragMoveEvent | DragOverEvent) => {
    const next = dropIntentFor(event)
    setDrop((prev) => {
      if (prev?.targetId === next?.targetId && prev?.zone === next?.zone) return prev
      // Every change of meaning is felt: a nest lands harder than a seam.
      if (next?.zone === 'nest') impact()
      else if (next) tick()
      return next
    })
  }

  const onDragStart = (event: DragStartEvent) => {
    pointerY.current = pointerYFrom(event.activatorEvent)
    setActiveDragId(String(event.active.id))
  }

  const onDragCancel = () => {
    setActiveDragId(null)
    setDrop(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const intent = dropIntentFor(event)
    setActiveDragId(null)
    setDrop(null)
    settle()
    if (!intent) return

    const draggedId = String(event.active.id)
    const { targetId, zone } = intent

    // Folder drag → reorder among folders (folders don't nest).
    const draggedFolder = folders.find((f) => f.id === draggedId)
    if (draggedFolder) {
      const rest = sortedFolders.filter((f) => f.id !== draggedId)
      const at = rest.findIndex((f) => f.id === targetId)
      if (at < 0) return
      const ids = insertAt(
        rest.map((f) => f.id),
        draggedId,
        zone === 'after' ? at + 1 : at,
      )
      patchFolders(orderPatch(ids))
      void reorderFolders(folderStore, ids)
      return
    }

    const dragged = deckById(draggedId)
    if (!dragged) return
    const previous = { parentId: dragged.parentId, folderId: dragged.folderId }
    const undo = {
      label: t('common.undo'),
      onClick: () => void moveDeck(deckStore, draggedId, previous.parentId, previous.folderId),
    }

    if (zone === 'nest') {
      const folder = folders.find((f) => f.id === targetId)
      const parentId = folder ? null : targetId
      const targetFolderId = folder ? folder.id : null
      // It goes to the end of its new home, which is where `moveDeck` puts it.
      const order = siblingDecks(decks, parentId, targetFolderId).length
      patchDecks(new Map([[draggedId, { parentId, folderId: targetFolderId, order }]]))
      void moveDeck(deckStore, draggedId, parentId, targetFolderId)

      if (folder) {
        toast.success(t('deck.movedToast', { folder: folder.name }), { action: undo })
        return
      }
      setExpanded((prev) => new Set(prev).add(targetId))
      toast.success(t('deck.movedIntoToast', { name: deckById(targetId)?.name ?? '' }), {
        action: undo,
      })
      return
    }

    // A seam: the deck joins the target's group at that exact slot — which is a
    // plain reorder when it's already in that group, and a move when it isn't.
    const target = deckById(targetId)
    if (!target) return
    const group = siblingDecks(decks, target.parentId, target.folderId)
    const rest = group.filter((d) => d.id !== draggedId)
    const at = rest.findIndex((d) => d.id === targetId)
    if (at < 0) return
    const ids = insertAt(
      rest.map((d) => d.id),
      draggedId,
      zone === 'after' ? at + 1 : at,
    )

    const reparented = dragged.parentId !== target.parentId || dragged.folderId !== target.folderId
    const patches = orderPatch<Deck>(ids)
    if (reparented) {
      patches.set(draggedId, {
        ...patches.get(draggedId),
        parentId: target.parentId,
        folderId: target.folderId,
      })
    }
    patchDecks(patches)

    void (async () => {
      // Reparent first: `moveDeck` parks the deck at the end of its new group,
      // and the reorder that follows puts it in the slot the line promised.
      if (reparented) await moveDeck(deckStore, draggedId, target.parentId, target.folderId)
      await reorderDecks(deckStore, ids)
    })()

    if (!reparented) return
    if (target.parentId) {
      setExpanded((prev) => new Set(prev).add(target.parentId as string))
      toast.success(t('deck.movedIntoToast', { name: deckById(target.parentId)?.name ?? '' }), {
        action: undo,
      })
      return
    }
    const folderName = target.folderId
      ? folders.find((f) => f.id === target.folderId)?.name
      : undefined
    toast.success(
      folderName ? t('deck.movedToast', { folder: folderName }) : t('deck.unfiledToast'),
      {
        action: undo,
      },
    )
  }

  const deckSwipeHandlers = (deck: Deck): SwipeActionHandlers => ({
    favorite: {
      onAction: () => void toggleDeckFavorite(deckStore, deck.id),
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
    },
    move: { onAction: () => void moveDeckPrompt(deck) },
    settings: { onAction: () => props.onOpenDeckSettings?.(deck.id) },
    addSubdeck: { onAction: () => void createSubdeckPrompt(deck) },
    duplicate: { onAction: () => duplicate(deck) },
    archive: { onAction: () => archiveDeck(deck) },
    delete: { onAction: () => void confirmDeleteDeck(deck) },
  })

  const folderSwipeHandlers = (folder: Folder): SwipeActionHandlers => ({
    edit: { onAction: () => void editFolderPrompt(folder) },
    addDeck: { onAction: () => void createDeckPrompt(folder.id) },
    delete: { onAction: () => void confirmDeleteFolder(folder) },
  })

  const canImport = Boolean(props.onImportPaste)

  return {
    stickyHeader,
    ready,
    isEmpty,
    inFolder,
    folderId,
    openFolder,
    sortedFolders,
    decks,
    cards,
    folderDeckCounts,
    expanded,
    toggleExpand,
    openFolderRoot: setFolderId,
    closeFolder: () => setFolderId(null),
    openFolderMenu,
    // Header
    name,
    avatar: profile.avatar,
    xp: progress?.xp ?? 0,
    unreadCount,
    dayCount,
    dailyGoal: prefs.dailyGoal,
    streakCount: progress?.streakCount ?? 0,
    // Select
    selectMode,
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    enterSelect,
    exitSelect,
    bulk,
    // Drag
    dndSensors,
    collisionDetection,
    activeDragId,
    activeDragDeck,
    activeDragFolder,
    drop,
    settling,
    dragDueCounts,
    now,
    onDragStart,
    onDragMove: trackDropIntent,
    onDragOver: trackDropIntent,
    onDragEnd,
    onDragCancel,
    // Swipe
    swipe: prefs.swipe,
    deckSwipeHandlers,
    folderSwipeHandlers,
    // Create / edit / delete
    createDeckPrompt,
    createSubdeckPrompt,
    createFolderPrompt,
    moveDeckPrompt,
    confirmDeleteDeck,
    confirmDeleteFolder,
    // Import
    canImport,
    // Toolbar config
    selectToolbarConfig: prefs.selectToolbar.library,
  }
}

export type DeckLibraryVm = ReturnType<typeof useDeckLibrary>
