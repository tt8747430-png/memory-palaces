import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  FileText,
  FolderInput,
  FolderPlus,
  Layers,
  MoreVertical,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import type { Deck } from '@/entities/deck'
import {
  DECK_COLOR_OPTIONS,
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  DEFAULT_FOLDER_ICON,
  type Folder,
  selectFolders,
  selectIsReady as selectFoldersReady,
  useFolderStore,
  useFolderStoreApi,
} from '@/entities/folder'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { useSessionStore } from '@/entities/session'
import {
  createDeck,
  createSubdeck,
  deleteDeck,
  duplicateDeck,
  moveDeck,
  reorderDecks,
  setDeckArchived,
  toggleDeckFavorite,
} from '@/features/deck'
import { createFolder, deleteFolder, editFolder, reorderFolders } from '@/features/folder'
import { readAnkiFile } from '@/features/content'
import { DeckTree } from '@/widgets/deck-tree'
import { HomeHeader } from '@/widgets/home-header'
import { useImportDraft } from '@/widgets/content-editor'
import {
  canReparent,
  cn,
  ContentImportError,
  dayKey,
  impact,
  nextDefaultName,
  subtreeDeckIds,
  useLongPress,
  useSortableSensors,
  useStickyHeader,
} from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  ActionSheet,
  AppScreen,
  buildSwipeActions,
  Button,
  ConfirmDialog,
  DeckCover,
  EmptyState,
  FolderGlyph,
  IconButton,
  ImportRow,
  PromptSheet,
  SelectDot,
  Sheet,
  type SheetAction,
  SpeedDial,
  type SwipeActionHandlers,
  SwipeRow,
} from '@/shared/ui'
import type { MoveDestination } from './MoveDeckSheet'
import { FolderSheet } from './FolderSheet'
import { MoveDeckSheet } from './MoveDeckSheet'

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

const noop = () => {}

function deckNameFromFile(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Imported'
  )
}

type CreatePrompt =
  | { kind: 'deck'; folderId: string | null }
  | { kind: 'subdeck'; parentId: string; parentName: string }

export function DeckLibraryPage({
  onOpenDeck,
  onOpenDeckSettings,
  onImportPaste,
  onReviewDeck,
  onOpenProfile,
  onOpenNotifications,
  onOpenStreak,
  onOpenArchived,
}: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const stickyHeader = useStickyHeader()
  const folderStore = useFolderStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const setImportDraft = useImportDraft((s) => s.setDraft)
  const importFileRef = useRef<HTMLInputElement>(null)
  const canImport = Boolean(onImportPaste)
  const profileStore = useProfileStoreApi()
  const progressStore = useProgressStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const notificationStore = useNotificationStoreApi()

  useEffect(() => {
    folderStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
    profileStore.getState().start()
    progressStore.getState().start()
    preferencesStore.getState().start()
    notificationStore.getState().start()
  }, [
    folderStore,
    deckStore,
    cardStore,
    profileStore,
    progressStore,
    preferencesStore,
    notificationStore,
  ])

  const storeFolders = useFolderStore(selectFolders)
  const storeDecks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectFoldersReady)
  const decksReady = useDeckStore(selectDecksReady)
  const ready = foldersReady && decksReady

  // Optimistic order: a reorder applies to this local copy immediately and is
  // reconciled when the persisted order flows back, killing the drop flicker.
  const [folders, setFolders] = useState(storeFolders)
  const [decks, setDecks] = useState(storeDecks)
  useEffect(() => setFolders(storeFolders), [storeFolders])
  useEffect(() => setDecks(storeDecks), [storeDecks])

  const session = useSessionStore((state) => state.session)
  const profile = useProfileStore(selectEffectiveProfile)
  const progress = useProgressStore(selectProgress)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const unreadCount = useNotificationStore(selectUnreadCount)

  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const today = dayKey(Date.now())
  const dayCount = progress?.activeDayKey === today ? progress.activeDayCount : 0

  const [folderId, setFolderId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const [createPrompt, setCreatePrompt] = useState<CreatePrompt | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null | undefined>(undefined)
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<string | null>(null)
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Leaving or entering a folder ends any in-progress selection.
  useEffect(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [folderId])

  const openFolder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])
  const inFolder = openFolder != null

  const nextFolderColor = DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value
  const defaultFolderName = useMemo(
    () =>
      nextDefaultName(
        t('folder.baseName'),
        folders.map((f) => f.name),
      ),
    [folders, t],
  )

  const deckById = (id: string) => decks.find((d) => d.id === id)
  const deletingDeck = pendingDeleteDeck ? deckById(pendingDeleteDeck) : undefined
  const deletingFolder = pendingDeleteFolder
    ? folders.find((f) => f.id === pendingDeleteFolder)
    : undefined
  const movingDeck = moveTarget ? deckById(moveTarget) : undefined

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

  const defaultCreateName = useMemo(() => {
    if (!createPrompt) return ''
    if (createPrompt.kind === 'subdeck') {
      const siblings = decks.filter((d) => d.parentId === createPrompt.parentId).map((d) => d.name)
      return nextDefaultName(t('deck.baseSubdeckName'), siblings)
    }
    const siblings = decks
      .filter(
        (d) => d.parentId === null && (d.folderId ?? null) === (createPrompt.folderId ?? null),
      )
      .map((d) => d.name)
    return nextDefaultName(t('deck.baseDeckName'), siblings)
  }, [createPrompt, decks, t])

  const submitCreate = (value: string) => {
    if (!createPrompt) return
    if (createPrompt.kind === 'subdeck') {
      void createSubdeck(deckStore, createPrompt.parentId, { name: value })
      setExpanded((prev) => new Set(prev).add(createPrompt.parentId))
      return
    }
    void createDeck(deckStore, { name: value, folderId: createPrompt.folderId })
  }

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = await readAnkiFile(file)
      if (data.cards.length === 0) {
        toast.error(t('cards.transfer.noCardsFound'))
        return
      }
      const deck = await createDeck(deckStore, { name: deckNameFromFile(file.name) })
      setImportDraft('anki', data.cards)
      onReviewDeck?.(deck.id)
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('cards.transfer.importFailed'),
      )
    }
  }

  const openCreateFolder = () => setFolderSheetTarget(null)
  const openEditFolder = (folder: Folder) => setFolderSheetTarget(folder)

  const submitFolder = (changes: { name: string; color: string; icon: string }) => {
    if (folderSheetTarget) {
      void editFolder(folderStore, folderSheetTarget, changes)
    } else {
      void createFolder(folderStore, changes)
      if (inFolder) setFolderId(null)
    }
    setFolderSheetTarget(undefined)
  }

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

  const moveDeckTo = (dest: MoveDestination) => {
    const deck = movingDeck
    setMoveTarget(null)
    if (!deck) return
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
      { action: undo },
    )
  }

  const confirmDeleteDeck = () => {
    if (pendingDeleteDeck) void deleteDeck(deckStore, cardStore, pendingDeleteDeck)
    setPendingDeleteDeck(null)
  }

  const confirmDeleteFolder = () => {
    if (pendingDeleteFolder) {
      void deleteFolder(folderStore, deckStore, pendingDeleteFolder)
      if (folderId === pendingDeleteFolder) setFolderId(null)
    }
    setPendingDeleteFolder(null)
  }

  // ---- Multi-select (long-press) ----
  const requestSelect = (id: string) => {
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

  // A deck can't be moved into itself or any of its own descendants.
  const moveExcludeIds = useMemo(() => {
    const ids = new Set<string>()
    const targets = bulkMoveOpen ? selectedDeckIds : moveTarget ? [moveTarget] : []
    for (const id of targets) for (const sub of subtreeDeckIds(decks, id)) ids.add(sub)
    return ids
  }, [bulkMoveOpen, selectedDeckIds, moveTarget, decks])
  const allSelected =
    selectableIds.size > 0 && [...selectableIds].every((id) => selectedIds.has(id))
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(selectableIds))

  const bulkArchive = () => {
    const ids = selectedDeckIds
    ids.forEach((id) => void setDeckArchived(deckStore, id, true))
    toast.success(t('library.select.archivedToast', { count: ids.length }))
    exitSelect()
  }
  const bulkMoveTo = (dest: MoveDestination) => {
    const ids = selectedDeckIds
    setBulkMoveOpen(false)
    if (dest.kind === 'archive') {
      ids.forEach((id) => void setDeckArchived(deckStore, id, true))
      toast.success(t('library.select.archivedToast', { count: ids.length }))
      exitSelect()
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
      exitSelect()
      return
    }
    const targetFolderId = dest.kind === 'folder' ? dest.folderId : null
    ids.forEach((id) => void moveDeck(deckStore, id, null, targetFolderId))
    const folderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name
      : undefined
    toast.success(
      folderName
        ? t('library.select.movedToast', { count: ids.length, folder: folderName })
        : t('library.select.unfiledToast', { count: ids.length }),
    )
    exitSelect()
  }
  const confirmBulkDelete = () => {
    const folderIds = [...selectedIds].filter((id) => folders.some((f) => f.id === id))
    const deckIds = [...selectedIds].filter((id) => decks.some((d) => d.id === id))
    folderIds.forEach((id) => void deleteFolder(folderStore, deckStore, id))
    deckIds.forEach((id) => void deleteDeck(deckStore, cardStore, id))
    if (folderId && folderIds.includes(folderId)) setFolderId(null)
    setBulkDeleteOpen(false)
    exitSelect()
  }

  // ---- Drag: reorder + reparent (select mode) ----
  const dndSensors = useSortableSensors()
  // A dragged folder only targets folders (it can't nest into a deck), so a
  // folder reorder never gets hijacked by a nearby deck's center.
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const activeId = String(args.active.id)
      if (folders.some((f) => f.id === activeId)) {
        const folderOnly = args.droppableContainers.filter((c) =>
          folders.some((f) => f.id === c.id),
        )
        return closestCenter({ ...args, droppableContainers: folderOnly })
      }
      return closestCenter(args)
    },
    [folders],
  )
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeDragDeck = activeDragId ? deckById(activeDragId) : undefined
  const activeDragFolder = activeDragId ? folders.find((f) => f.id === activeDragId) : undefined
  const activeKind: 'deck' | 'folder' | null =
    activeDragId == null ? null : activeDragFolder ? 'folder' : 'deck'

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return
    const draggedId = String(active.id)
    const targetId = String(over.id)
    if (draggedId === targetId) return

    // Folder drag → reorder among folders (folders don't nest).
    if (folders.some((f) => f.id === draggedId)) {
      if (!folders.some((f) => f.id === targetId)) return
      const from = sortedFolders.findIndex((f) => f.id === draggedId)
      const to = sortedFolders.findIndex((f) => f.id === targetId)
      if (from < 0 || to < 0) return
      const next = arrayMove(sortedFolders, from, to).map((f, i) => ({ ...f, order: i }))
      setFolders(next) // optimistic
      void reorderFolders(
        folderStore,
        next.map((f) => f.id),
      )
      return
    }

    const dragged = deckById(draggedId)
    if (!dragged) return

    // Onto a folder → move in as a root deck of that folder.
    if (folders.some((f) => f.id === targetId)) {
      if (dragged.parentId === null && (dragged.folderId ?? null) === targetId) return
      void moveDeck(deckStore, draggedId, null, targetId)
      toast.success(
        t('deck.movedToast', { folder: folders.find((f) => f.id === targetId)?.name ?? '' }),
      )
      return
    }

    const target = deckById(targetId)
    if (!target) return

    // Same sibling group → reorder within the group (manual sort).
    const sameGroup =
      dragged.parentId === target.parentId &&
      (dragged.folderId ?? null) === (target.folderId ?? null)
    if (sameGroup) {
      const siblings = decks
        .filter(
          (d) =>
            d.parentId === dragged.parentId &&
            (d.folderId ?? null) === (dragged.folderId ?? null) &&
            !d.archived,
        )
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      const from = siblings.findIndex((d) => d.id === draggedId)
      const to = siblings.findIndex((d) => d.id === targetId)
      if (from < 0 || to < 0) return
      const reorderedIds = arrayMove(siblings, from, to).map((d) => d.id)
      const orderById = new Map(reorderedIds.map((id, i) => [id, i]))
      setDecks((prev) =>
        prev.map((d) => (orderById.has(d.id) ? { ...d, order: orderById.get(d.id)! } : d)),
      ) // optimistic
      void reorderDecks(deckStore, reorderedIds)
      return
    }

    // Onto a deck in another group → become its subdeck.
    if (!canReparent(decks, draggedId, targetId)) {
      toast.error(t('deck.cantMoveIntoSelf'))
      return
    }
    void moveDeck(deckStore, draggedId, targetId, null)
    setExpanded((prev) => new Set(prev).add(targetId))
    toast.success(t('deck.movedIntoToast', { name: target.name }))
  }

  const deckSwipeHandlers = (deck: Deck): SwipeActionHandlers => ({
    favorite: {
      onAction: () => void toggleDeckFavorite(deckStore, deck.id),
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
    },
    move: { onAction: () => setMoveTarget(deck.id) },
    settings: { onAction: () => onOpenDeckSettings?.(deck.id) },
    addSubdeck: {
      onAction: () =>
        setCreatePrompt({ kind: 'subdeck', parentId: deck.id, parentName: deck.name }),
    },
    duplicate: { onAction: () => duplicate(deck) },
    archive: { onAction: () => archiveDeck(deck) },
    delete: { onAction: () => setPendingDeleteDeck(deck.id) },
  })

  const folderActions = (folder: Folder): SheetAction[] => [
    {
      id: 'settings',
      label: t('folder.settings'),
      icon: <Settings2 className="size-5" aria-hidden />,
      onSelect: () => openEditFolder(folder),
    },
    {
      id: 'add-deck',
      label: t('folder.addDeck'),
      icon: <Plus className="size-5" aria-hidden />,
      onSelect: () => setCreatePrompt({ kind: 'deck', folderId: folder.id }),
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => setPendingDeleteFolder(folder.id),
    },
  ]

  const folderSwipeHandlers = (folder: Folder): SwipeActionHandlers => ({
    edit: { onAction: () => openEditFolder(folder) },
    addDeck: { onAction: () => setCreatePrompt({ kind: 'deck', folderId: folder.id }) },
    delete: { onAction: () => setPendingDeleteFolder(folder.id) },
  })

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={stickyHeader.ref}
      header={
        selectMode ? (
          <header className="bg-glass pt-safe">
            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="-mx-2 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--p-text-body)] font-semibold text-accent"
              >
                {allSelected ? t('library.select.clearAll') : t('library.select.selectAll')}
              </button>
              <span className="text-[length:var(--p-text-body)] font-semibold tabular-nums text-heading">
                {t('library.select.count', { count: selectedCount })}
              </span>
              <button
                type="button"
                onClick={exitSelect}
                className="-mx-2 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--p-text-body)] font-semibold text-accent"
              >
                {t('common.cancel')}
              </button>
            </div>
          </header>
        ) : inFolder ? (
          <header className="bg-glass pt-safe">
            <div className="flex items-center gap-2 px-2 py-2">
              <IconButton
                variant="glass"
                aria-label={t('common.back')}
                onClick={() => setFolderId(null)}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </IconButton>
              <h1 className="min-w-0 flex-1 truncate text-center text-[length:var(--p-text-title)] font-semibold text-heading">
                {openFolder?.name}
              </h1>
              <IconButton
                variant="glass"
                aria-label={t('folder.rowActions', { name: openFolder?.name ?? '' })}
                onClick={() => setFolderMenuOpen(true)}
              >
                <MoreVertical className="size-5" aria-hidden />
              </IconButton>
            </div>
          </header>
        ) : (
          <HomeHeader
            header={stickyHeader}
            name={name}
            avatar={profile.avatar}
            xp={progress?.xp ?? 0}
            unreadCount={unreadCount}
            onOpenProfile={onOpenProfile ?? noop}
            onOpenNotifications={onOpenNotifications ?? noop}
            onOpenArchived={onOpenArchived}
            streak={
              onOpenStreak
                ? { count: progress?.streakCount ?? 0, dayCount, dailyGoal: prefs.dailyGoal }
                : undefined
            }
            onOpenStreak={onOpenStreak}
          />
        )
      }
    >
      {!ready ? (
        <LibrarySkeleton />
      ) : isEmpty ? (
        <EmptyState
          emoji={inFolder ? '📂' : '🗂️'}
          title={inFolder ? t('library.emptyFolderTitle') : t('library.emptyTitle')}
          description={inFolder ? t('library.emptyFolderHint') : t('library.emptyHint')}
          action={
            <div className="flex w-full max-w-60 flex-col gap-2">
              <Button
                onClick={() =>
                  setCreatePrompt({ kind: 'deck', folderId: inFolder ? folderId : null })
                }
              >
                <Plus className="size-[18px]" aria-hidden />
                {inFolder ? t('folder.addDeck') : t('deck.newDeck')}
              </Button>
              {canImport ? (
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <ClipboardPaste className="size-[18px]" aria-hidden />
                  {t('deck.importCards')}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : (
        <DndContext
          sensors={dndSensors}
          collisionDetection={collisionDetection}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={(e: DragStartEvent) => setActiveDragId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div className="flex flex-col gap-2 pt-2">
            {!inFolder ? (
              <SortableContext
                items={sortedFolders.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedFolders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    deckCount={folderDeckCounts.get(folder.id) ?? 0}
                    selectMode={selectMode}
                    selected={selectedIds.has(folder.id)}
                    activeKind={activeKind}
                    onOpen={() => setFolderId(folder.id)}
                    onRequestSelect={() => requestSelect(folder.id)}
                    onToggleSelect={() => toggleSelect(folder.id)}
                    swipe={prefs.swipe.folder}
                    swipeHandlers={folderSwipeHandlers(folder)}
                  />
                ))}
              </SortableContext>
            ) : null}

            <DeckTree
              decks={decks}
              cards={cards}
              expanded={expanded}
              onToggle={toggle}
              onOpen={onOpenDeck}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onRequestSelect={requestSelect}
              onToggleSelect={toggleSelect}
              parentId={null}
              folderId={inFolder ? (folderId as string) : null}
              swipe={prefs.swipe.deck}
              swipeHandlers={deckSwipeHandlers}
            />
          </div>

          <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
            {activeDragDeck ? (
              <div className="flex scale-[1.02] items-center gap-3 rounded-card bg-card px-2.5 py-2 shadow-elevated ring-1 ring-accent">
                <DeckCover
                  icon={activeDragDeck.icon || DEFAULT_DECK_ICON}
                  color={activeDragDeck.color || DEFAULT_DECK_COLOR}
                  className="size-9 rounded-2xl ring-1 ring-black/5"
                  iconClassName="text-base leading-none"
                />
                <span className="truncate text-[length:var(--p-text-body)] font-semibold text-heading">
                  {activeDragDeck.name}
                </span>
              </div>
            ) : activeDragFolder ? (
              <div className="flex scale-[1.02] items-center gap-3 rounded-card bg-card px-2.5 py-2.5 shadow-elevated ring-1 ring-accent">
                <FolderGlyph
                  color={activeDragFolder.color}
                  icon={activeDragFolder.icon || DEFAULT_FOLDER_ICON}
                  className="size-11 rounded-2xl"
                  iconClassName="text-xl leading-none"
                />
                <span className="truncate text-[length:var(--p-text-title)] font-semibold text-heading">
                  {activeDragFolder.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectMode ? (
        <div className="fixed inset-x-0 bottom-0 z-[300] mx-auto w-full max-w-[430px] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
          <div className="flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
            <BulkButton
              disabled={selectedDeckIds.length === 0}
              icon={<FolderInput className="size-[17px]" aria-hidden />}
              label={t('deck.move')}
              onClick={() => setBulkMoveOpen(true)}
            />
            <BulkButton
              disabled={selectedDeckIds.length === 0}
              icon={<Archive className="size-[17px]" aria-hidden />}
              label={t('deck.archive')}
              onClick={bulkArchive}
            />
            <BulkButton
              tone="danger"
              disabled={selectedCount === 0}
              icon={<Trash2 className="size-[17px]" aria-hidden />}
              label={t('common.delete')}
              onClick={() => setBulkDeleteOpen(true)}
            />
          </div>
        </div>
      ) : null}

      {!isEmpty && !selectMode ? (
        <SpeedDial
          label={t('deck.create')}
          actions={[
            {
              id: 'new-deck',
              label: inFolder ? t('folder.addDeck') : t('deck.newDeck'),
              icon: <Layers className="size-5" aria-hidden />,
              onSelect: () =>
                setCreatePrompt({ kind: 'deck', folderId: inFolder ? folderId : null }),
            },
            ...(canImport
              ? [
                  {
                    id: 'import',
                    label: t('deck.importCards'),
                    icon: <ClipboardPaste className="size-5" aria-hidden />,
                    onSelect: () => setImportOpen(true),
                  },
                ]
              : []),
            ...(inFolder
              ? []
              : [
                  {
                    id: 'new-folder',
                    label: t('deck.newFolder'),
                    icon: <FolderPlus className="size-5" aria-hidden />,
                    onSelect: openCreateFolder,
                  },
                ]),
          ]}
        />
      ) : null}

      <ActionSheet
        open={folderMenuOpen}
        onOpenChange={setFolderMenuOpen}
        title={openFolder?.name ?? ''}
        actions={openFolder ? folderActions(openFolder) : []}
        cancelLabel={t('common.cancel')}
      />

      <PromptSheet
        open={createPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setCreatePrompt(null)
        }}
        title={createPrompt?.kind === 'subdeck' ? t('deck.newSubdeck') : t('deck.newDeck')}
        description={
          createPrompt?.kind === 'subdeck'
            ? t('deck.subdeckOf', { name: createPrompt.parentName })
            : undefined
        }
        fieldLabel={t('deck.nameLabel')}
        placeholder={t('deck.namePlaceholder')}
        initialValue={defaultCreateName}
        confirmLabel={t('deck.create')}
        onSubmit={submitCreate}
      />

      <Sheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('deck.importTitle')}
        description={t('deck.importSheetHint')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<ClipboardPaste className="size-5" aria-hidden />}
            tone="accent"
            title={t('cards.transfer.pasteNotes')}
            subtitle={t('cards.transfer.pasteNotesSub')}
            onClick={() => {
              setImportOpen(false)
              onImportPaste?.()
            }}
          />
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="warning"
            badge="CSV · TSV · TXT"
            title={t('cards.transfer.importAnki')}
            subtitle={t('cards.transfer.importAnkiSub')}
            onClick={() => {
              setImportOpen(false)
              importFileRef.current?.click()
            }}
          />
        </div>
      </Sheet>

      <input
        ref={importFileRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={onImportFile}
        aria-hidden
        tabIndex={-1}
      />

      <FolderSheet
        open={folderSheetTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setFolderSheetTarget(undefined)
        }}
        folder={folderSheetTarget}
        defaultColor={nextFolderColor}
        defaultName={defaultFolderName}
        onSubmit={submitFolder}
      />

      <MoveDeckSheet
        open={moveTarget !== null || bulkMoveOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMoveTarget(null)
            setBulkMoveOpen(false)
          }
        }}
        subtitle={
          bulkMoveOpen
            ? t('library.select.count', { count: selectedDeckIds.length })
            : (movingDeck?.name ?? '')
        }
        decks={decks}
        folders={sortedFolders}
        excludeIds={moveExcludeIds}
        onPick={bulkMoveOpen ? bulkMoveTo : moveDeckTo}
        onNewFolder={() => {
          setMoveTarget(null)
          setBulkMoveOpen(false)
          openCreateFolder()
        }}
      />

      <ConfirmDialog
        open={pendingDeleteDeck !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteDeck(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('deck.deleteTitle', { name: deletingDeck?.name ?? '' })}
        description={t('deck.deleteBody')}
        confirmLabel={t('deck.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteDeck}
      />

      <ConfirmDialog
        open={pendingDeleteFolder !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteFolder(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('folder.deleteTitle', { name: deletingFolder?.name ?? '' })}
        description={t('folder.deleteBody')}
        confirmLabel={t('folder.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteFolder}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteOpen(false)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('library.select.deleteTitle', { count: selectedCount })}
        description={t('library.select.deleteBody')}
        confirmLabel={t('deck.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmBulkDelete}
      />
    </AppScreen>
  )
}

interface FolderRowProps {
  folder: Folder
  deckCount: number
  selectMode: boolean
  selected: boolean
  activeKind: 'deck' | 'folder' | null
  onOpen: () => void
  onRequestSelect: () => void
  onToggleSelect: () => void
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
}

function FolderRow({
  folder,
  deckCount,
  selectMode,
  selected,
  activeKind,
  onOpen,
  onRequestSelect,
  onToggleSelect,
  swipe,
  swipeHandlers,
}: FolderRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: () => (selectMode ? onToggleSelect() : onOpen()),
  })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)
  const swipeEnabled = !selectMode && (leading.length > 0 || trailing.length > 0)

  // Folders reorder among themselves; a dragged deck drops in to nest.
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: folder.id, disabled: !selectMode })
  const isNestTarget = isOver && activeKind === 'deck'

  const row = (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative flex w-full items-center gap-3.5 rounded-card bg-card py-2.5 pl-2.5 pr-2 shadow-card transition-[box-shadow,background-color]',
        selected && 'ring-2 ring-inset ring-accent',
        isNestTarget && 'bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background',
        isDragging && 'relative z-50 opacity-40',
      )}
    >
      {/* Whole-card activator — tap toggles / opens; press-and-hold drags. */}
      <button
        type="button"
        ref={selectMode ? setActivatorNodeRef : undefined}
        {...(selectMode
          ? { onClick: () => onToggleSelect(), ...attributes, ...listeners }
          : longPress)}
        aria-label={
          selectMode
            ? t('library.select.toggle', { name: folder.name })
            : t('folder.rowOpen', { name: folder.name })
        }
        aria-pressed={selectMode ? selected : undefined}
        className={cn(
          'absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]',
          selectMode && 'touch-pan-y',
        )}
      />

      {selectMode ? (
        <span className="pointer-events-none relative z-20 grid shrink-0 place-items-center">
          <SelectDot selected={selected} />
        </span>
      ) : null}

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
        {/* A folder is a container: the glyph carries pale "sheets" stacked
            behind it, so folders read as holding decks — not as another deck. */}
        <motion.span
          className="relative size-12 shrink-0"
          animate={{ scale: isNestTarget ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[5px] translate-y-[-4px] rounded-2xl bg-secondary/40 ring-1 ring-inset ring-border/60"
          />
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[2.5px] translate-y-[-2px] rounded-2xl bg-secondary/70 ring-1 ring-inset ring-border/70"
          />
          <FolderGlyph
            color={folder.color}
            icon={folder.icon || DEFAULT_FOLDER_ICON}
            className="relative size-12 rounded-2xl"
            iconClassName="text-xl leading-none"
          />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[length:var(--p-text-title)] font-semibold text-heading">
            {folder.name}
          </span>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-semibold',
              deckCount > 0
                ? 'bg-primary/[0.07] text-primary/80'
                : 'bg-secondary/40 text-muted-foreground',
            )}
          >
            <Layers className="size-3" aria-hidden />
            {deckCount > 0 ? t('folder.deckCount', { count: deckCount }) : t('folder.empty')}
          </span>
        </span>
        {selectMode ? null : (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
        )}
      </div>
    </div>
  )

  if (!swipeEnabled) return row
  return (
    <SwipeRow leading={leading} trailing={trailing} bleed>
      {row}
    </SwipeRow>
  )
}

function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-[length:var(--p-text-label)] font-semibold',
        'transition-transform active:scale-[0.97] disabled:opacity-40',
        tone === 'danger'
          ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
          : 'bg-info-surface text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function LibrarySkeleton() {
  return (
    <div className="space-y-1 pt-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border py-3.5">
          <span className="size-11 shrink-0 animate-pulse rounded-card bg-secondary/50" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="h-3.5 w-1/2 animate-pulse rounded-full bg-secondary/50" />
            <span className="h-3 w-1/3 animate-pulse rounded-full bg-secondary/40" />
          </span>
        </div>
      ))}
    </div>
  )
}
