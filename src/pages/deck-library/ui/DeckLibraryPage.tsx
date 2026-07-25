import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ClipboardPaste,
  FileText,
  FolderPlus,
  Layers,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import type { Deck } from '@/entities/deck'
import {
  DECK_COLOR_OPTIONS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
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
import { DeckTree, FOLDER_ROW_FRAME, FolderRowBody, LibrarySelectList } from '@/widgets/deck-tree'
import { HomeHeader } from '@/widgets/home-header'
import { useImportDraft } from '@/widgets/content-editor'
import {
  canReparent,
  cn,
  ContentImportError,
  dayKey,
  deckPath,
  flattenDecks,
  impact,
  nextDefaultName,
  orderPatch,
  siblingDecks,
  subtreeDeckIds,
  useLongPress,
  useOptimisticPatch,
  usePersistedSet,
  useStickyHeader,
} from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  ActionSheet,
  AppScreen,
  buildSwipeActions,
  Button,
  ConfirmDialog,
  Empty,
  IconButton,
  ImportRow,
  PromptSheet,
  type SelectActionHandlers,
  SelectToolbar,
  SelectToolbarDock,
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
  /** The folder this view is scoped to, or `null` for the unfiled root (home). */
  folderId: string | null
  onOpenFolder: (folderId: string) => void
  onCloseFolder: () => void
  /** The scoped folder no longer exists — deleted from inside it, or a stale link. */
  onFolderGone: () => void
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
  folderId,
  onOpenFolder,
  onCloseFolder,
  onFolderGone,
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

  // A drop shows up instantly and stays put: the new order and parent are held
  // over the store's emissions until the persisted rows agree with them.
  const [folders, patchFolders] = useOptimisticPatch(storeFolders)
  const [decks, patchDecks] = useOptimisticPatch(storeDecks)

  const session = useSessionStore((state) => state.session)
  const profile = useProfileStore(selectEffectiveProfile)
  const progress = useProgressStore(selectProgress)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const unreadCount = useNotificationStore(selectUnreadCount)

  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const today = dayKey(Date.now())
  const dayCount = progress?.activeDayKey === today ? progress.activeDayCount : 0

  // Which decks are expanded persists across app restarts (view state, not domain).
  const [expanded, setExpanded] = usePersistedSet('mindscape.library.expanded')
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
  // Scope comes from the route, not from whether the record has arrived: a folder still loading
  // is a folder view with nothing in it yet, never a flash of the whole library.
  const inFolder = folderId !== null

  // Once the folders are in and this one isn't among them, the route is pointing at nothing.
  useEffect(() => {
    if (inFolder && foldersReady && !openFolder) onFolderGone()
  }, [inFolder, foldersReady, openFolder, onFolderGone])

  const nextFolderColor = DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value
  const defaultFolderName = useMemo(
    () =>
      nextDefaultName(
        t('folder.baseName'),
        folders.map((f) => f.name),
      ),
    [folders, t],
  )

  const decksById = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])
  const deckById = useCallback((id: string) => decksById.get(id), [decksById])
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
  const folderIdSet = useMemo(() => new Set(folders.map((f) => f.id)), [folders])
  /** The browse tree: this scope's decks, nested, descending only into what is expanded. */
  const flat = useMemo(() => flattenDecks(decks, expanded, folderId), [decks, expanded, folderId])

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
      // A new folder is a sibling of the one you are standing in, so step back out to see it.
      if (inFolder) onCloseFolder()
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
      if (folderId === pendingDeleteFolder) onFolderGone()
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

  // Selecting a deck takes its whole (non-archived) subtree with it: select mode is flat, so a
  // deck's subdecks are off screen and can only ever travel with their root.
  const deckSubtree = (id: string) =>
    subtreeDeckIds(decks, id).filter((sid) => !decksById.get(sid)?.archived)
  /**
   * Press-and-hold anywhere in the tree opens select mode. What it selects is the *top-level*
   * deck of whatever was held — a subdeck isn't one of the rows select mode shows, so selecting
   * it there would be a selection you cannot see.
   */
  const requestDeckSelect = (id: string) => {
    impact()
    const top = deckPath(decks, id)[0]?.id ?? id
    setSelectMode(true)
    setSelectedIds(new Set(deckSubtree(top)))
  }
  const toggleDeckSelect = (id: string) =>
    setSelectedIds((prev) => {
      const subtree = deckSubtree(id)
      const next = new Set(prev)
      if (subtree.every((sid) => next.has(sid))) for (const sid of subtree) next.delete(sid)
      // Re-adding moves the root to the end of the set, which is how the drag stack knows which
      // row was chosen last and belongs on top.
      else for (const sid of subtree) next.add(sid)
      return next
    })

  /** The rows select mode actually shows: this scope's folders and its top-level decks. */
  const sectionFolders = inFolder ? [] : sortedFolders
  const sectionDecks = useMemo(() => siblingDecks(decks, null, folderId), [decks, folderId])
  const selectableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const f of sectionFolders) ids.add(f.id)
    for (const d of sectionDecks) for (const sid of deckSubtree(d.id)) ids.add(sid)
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFolders, sectionDecks, decks])

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
    toast.success(t('library.select.archivedToast', { count: ids.length }), {
      action: {
        label: t('common.undo'),
        onClick: () => ids.forEach((id) => void setDeckArchived(deckStore, id, false)),
      },
    })
    exitSelect()
  }

  // Favorite is a set, not a flip: a mixed selection favorites everything, and
  // only an all-favorited selection clears — so the tap always has one meaning.
  const selectedDecks = useMemo(
    () => selectedDeckIds.map((id) => deckById(id)).filter((d): d is Deck => d !== undefined),
    [selectedDeckIds, deckById],
  )
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
    exitSelect()
  }

  const bulkDuplicate = () => {
    const ids = selectedDeckIds
    ids.forEach((id) => void duplicateDeck(deckStore, cardStore, id))
    toast.success(t('library.select.duplicatedToast', { count: ids.length }))
    exitSelect()
  }

  // "Unfile" lifts decks back out to the top level — out of a folder, out of a
  // parent deck. Decks already sitting there have nothing to lift.
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
      action: {
        label: t('common.undo'),
        onClick: () => moved.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
      },
    })
    exitSelect()
  }

  // The bar the learner configured (Settings → Select toolbar), wired to what a
  // library selection can actually do. Folder-only selections keep the
  // deck-shaped actions visible but disabled, so the bar never rearranges.
  const noDecks = selectedDeckIds.length === 0
  const selectHandlers: SelectActionHandlers = {
    move: { onAction: () => setBulkMoveOpen(true), disabled: noDecks },
    favorite: { onAction: bulkFavorite, disabled: noDecks },
    duplicate: { onAction: bulkDuplicate, disabled: noDecks },
    archive: { onAction: bulkArchive, disabled: noDecks },
    unfile: { onAction: bulkUnfile, disabled: filedDecks.length === 0 },
    delete: { onAction: () => setBulkDeleteOpen(true), disabled: selectedCount === 0 },
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
    if (folderId && folderIds.includes(folderId)) onFolderGone()
    setBulkDeleteOpen(false)
    exitSelect()
  }

  // ---- Drag: reorder, and file a deck into a folder (select mode only) ----
  //
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
    const folderName = folders.find((f) => f.id === targetFolderId)?.name ?? ''
    toast.success(t('library.select.movedToast', { count: moving.length, folder: folderName }), {
      action: {
        label: t('common.undo'),
        onClick: () =>
          previous.forEach((d) => void moveDeck(deckStore, d.id, d.parentId, d.folderId)),
      },
    })
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
      icon: <Settings className="size-5" aria-hidden />,
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
              <IconButton variant="glass" aria-label={t('common.back')} onClick={onCloseFolder}>
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
        <Empty
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
      ) : selectMode ? (
        /* Selecting flattens the library: folders, then decks, no nesting on screen. Every row
           is a peer of every other in its section, so the reorder the drag animates is the
           reorder the drop performs — and a deck released over a folder files itself there. */
        <LibrarySelectList
          folders={sectionFolders}
          decks={sectionDecks}
          allDecks={decks}
          cards={cards}
          folderDeckCounts={folderDeckCounts}
          selectedIds={selectedIds}
          onToggleSelect={(id) => (folderIdSet.has(id) ? toggleSelect(id) : toggleDeckSelect(id))}
          onReorderFolders={reorderFolderIds}
          onReorderDecks={reorderDeckIds}
          onFileDecks={fileDecksIntoFolder}
        />
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {!inFolder
            ? sortedFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  deckCount={folderDeckCounts.get(folder.id) ?? 0}
                  onOpen={() => onOpenFolder(folder.id)}
                  onRequestSelect={() => requestSelect(folder.id)}
                  swipe={prefs.swipe.folder}
                  swipeHandlers={folderSwipeHandlers(folder)}
                />
              ))
            : null}

          <DeckTree
            rows={flat}
            decks={decks}
            cards={cards}
            expanded={expanded}
            onToggle={toggle}
            onOpen={onOpenDeck}
            onRequestSelect={requestDeckSelect}
            swipe={prefs.swipe.deck}
            swipeHandlers={deckSwipeHandlers}
          />
        </div>
      )}

      {selectMode ? (
        <SelectToolbarDock>
          <SelectToolbar actions={prefs.selectToolbar.library} handlers={selectHandlers} />
        </SelectToolbarDock>
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
  onOpen: () => void
  onRequestSelect: () => void
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
}

/** A folder at rest: tap to open it, press-and-hold to start a selection. */
function FolderRow({
  folder,
  deckCount,
  onOpen,
  onRequestSelect,
  swipe,
  swipeHandlers,
}: FolderRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({ onLongPress: onRequestSelect, onTap: onOpen })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)
  const swipeEnabled = leading.length > 0 || trailing.length > 0

  const row = (
    <div
      className={cn(
        FOLDER_ROW_FRAME,
        'relative bg-card shadow-card transition-[box-shadow,background-color]',
      )}
    >
      <button
        type="button"
        {...longPress}
        aria-label={t('folder.rowOpen', { name: folder.name })}
        className="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
      />
      <FolderRowBody folder={folder} deckCount={deckCount} />
    </div>
  )

  return swipeEnabled ? (
    <SwipeRow leading={leading} trailing={trailing} bleed>
      {row}
    </SwipeRow>
  ) : (
    row
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
