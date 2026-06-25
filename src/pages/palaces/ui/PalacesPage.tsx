import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Archive,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  FolderPlus,
  GripVertical,
  LayoutGrid,
  ListChecks,
  Pencil,
  Plus,
  Rows3,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  ContentImportError,
  cn,
  countDuePerPalace,
  isRoomCompleted,
  palaceProgress,
  useStickyHeader,
} from '@/shared/lib'
import {
  PALACE_COLOR_OPTIONS,
  selectIsReady,
  selectPalaces,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { type Folder, selectFolders, useFolderStore, useFolderStoreApi } from '@/entities/folder'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { useQuestionStoreApi } from '@/entities/question'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { useSessionStore } from '@/entities/session'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
  type PalacesSort,
  type PalacesView,
} from '@/entities/preferences'
import {
  deletePalace,
  importPalace,
  reorderPalaces,
  setPalaceArchived,
  setPalaceFolder,
  togglePalaceFavorite,
  CreatePalaceSheet,
} from '@/features/palace'
import { readPalaceFile } from '@/features/content'
import { createFolder, deleteFolder, editFolder, reorderFolders } from '@/features/folder'
import { setPreferences } from '@/features/preferences'
import {
  LibraryGrid,
  type LibraryFolderItem,
  type LibraryHandlers,
  type LibraryPalaceItem,
} from '@/widgets/library'
import { HomeHeader } from '@/widgets/home-header'
import {
  ActionSheet,
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyState,
  FolderGlyph,
  IconButton,
  SegmentedControl,
  SpeedDial,
  StickyBar,
} from '@/shared/ui'
import { FolderSheet, MoveToFolderSheet } from './PalaceSheets'

/** The archived view is a reserved "folder" id, so it rides the same `?folder=` navigation. */
export const ARCHIVED_VIEW = '__archived__'

export interface PalacesPageProps {
  /** Open a palace's detail; wired by the route wrapper. */
  onOpenPalace?: (id: string) => void
  /** Open a palace's settings directly from its menu; wired by the route wrapper. */
  onOpenPalaceSettings?: (id: string) => void
  /** The folder currently being browsed (`null`/undefined = root), from `?folder=`. */
  folderId?: string | null
  /** Enter a folder (push `?folder=<id>`); the archived view uses {@link ARCHIVED_VIEW}. */
  onOpenFolder?: (id: string) => void
  /** Return to the library root (clear `?folder`). */
  onCloseFolder?: () => void
  /** Open the create sheet on mount (a `?create` deep link still opens it). */
  openCreate?: boolean
  onOpenProfile?: () => void
  onOpenNotifications?: () => void
  onOpenStreak?: () => void
}

const SORT_LABEL_KEY = {
  manual: 'palaces.sortManual',
  recent: 'palaces.sortRecent',
  progress: 'palaces.sortProgress',
  name: 'palaces.sortName',
  category: 'palaces.sortCategory',
} as const satisfies Record<PalacesSort, string>

/** The library — a Windows-Explorer-style browse of folders and palaces. The root is the
 * app's home (greeting header); drilling into a folder or the archived view swaps in a
 * named page header that carries the sort/select/view controls. Reorder by drag (manual
 * sort) or an automatic rule, file palaces into folders, multi-select for bulk actions.
 * Reactive off RxDB; every action persists offline through the injected stores. */
export function PalacesPage({
  onOpenPalace,
  onOpenPalaceSettings,
  folderId = null,
  onOpenFolder,
  onCloseFolder,
  openCreate = false,
  onOpenProfile,
  onOpenNotifications,
  onOpenStreak,
}: PalacesPageProps = {}) {
  const { t } = useTranslation()
  const header = useStickyHeader()

  const palaceStore = usePalaceStoreApi()
  const folderStore = useFolderStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const prefStore = usePreferencesStoreApi()
  const profileStore = useProfileStoreApi()
  const progressStore = useProgressStoreApi()
  const notificationStore = useNotificationStoreApi()
  const importRef = useRef<HTMLInputElement>(null)

  const palaces = usePalaceStore(selectPalaces)
  const palacesReady = usePalaceStore(selectIsReady)
  const folders = useFolderStore(selectFolders)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const profile = useProfileStore(selectEffectiveProfile)
  const progress = useProgressStore(selectProgress)
  const unreadCount = useNotificationStore(selectUnreadCount)
  const session = useSessionStore((state) => state.session)

  const [now] = useState(() => Date.now())

  useEffect(() => {
    palaceStore.getState().start()
    folderStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    prefStore.getState().start()
    profileStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [
    palaceStore,
    folderStore,
    roomStore,
    locusStore,
    questionStore,
    prefStore,
    profileStore,
    progressStore,
    notificationStore,
  ])

  const view = prefs.palacesView
  const sort = prefs.palacesSort
  const setView = (value: PalacesView) => void setPreferences(prefStore, { palacesView: value })
  const setSort = (value: PalacesSort) => void setPreferences(prefStore, { palacesSort: value })

  const inArchived = folderId === ARCHIVED_VIEW
  const currentFolder = folders.find((folder) => folder.id === folderId)
  // A `?folder=` that points at a deleted folder falls back to the root.
  const atRoot = folderId === null || (folderId !== ARCHIVED_VIEW && !currentFolder)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(openCreate)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [folderSheetOpen, setFolderSheetOpen] = useState(false)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null>(null)
  const [deletePalaceTarget, setDeletePalaceTarget] = useState<string | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const openCreateFolder = () => {
    setFolderSheetTarget(null)
    setFolderSheetOpen(true)
  }
  const openEditFolder = (folder: Folder) => {
    setFolderSheetTarget(folder)
    setFolderSheetOpen(true)
  }

  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  // Search and select live only at the home root; leaving it (into a folder/archived view)
  // resets both so a stray query/selection can't filter or linger where there's no UI to clear it.
  useEffect(() => {
    if (!atRoot) {
      setSearchOpen(false)
      setQuery('')
      exitSelect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId])

  const dueCounts = useMemo(
    () => countDuePerPalace(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )

  const reviewerName = profile.name.trim() || session?.displayName || t('common.guest')

  // Enrich each palace with derived progress + sort keys, once.
  type Enriched = LibraryPalaceItem & { order: number; updatedAt: string }
  const enriched = useMemo<Enriched[]>(
    () =>
      palaces.map((palace) => {
        const completions = roomsForPalace(rooms, palace.id).map((room) =>
          isRoomCompleted(lociForRoom(loci, room.id)),
        )
        return {
          id: palace.id,
          name: palace.name,
          icon: palace.icon,
          color: palace.color,
          image: palace.image,
          category: palace.category,
          favorite: palace.favorite,
          archived: palace.archived,
          folderId: palace.folderId,
          order: palace.order,
          updatedAt: palace.updatedAt,
          progress: palaceProgress(completions),
          totalRooms: completions.length,
          dueCount: dueCounts.get(palace.id) ?? 0,
        }
      }),
    [palaces, rooms, loci, dueCounts],
  )

  const q = query.trim().toLowerCase()
  const matchesQuery = (name: string, category = '') =>
    !q || name.toLowerCase().includes(q) || category.toLowerCase().includes(q)

  const sortPalaces = (list: Enriched[]): Enriched[] =>
    [...list].sort((a, b) => {
      switch (sort) {
        case 'manual':
          return a.order - b.order || a.updatedAt.localeCompare(b.updatedAt)
        case 'progress':
          return b.progress - a.progress
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        default:
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    })

  const visiblePalaces = useMemo(() => {
    const pool = enriched.filter((item) => {
      if (inArchived) return item.archived
      if (item.archived) return false
      return (item.folderId ?? null) === (atRoot ? null : folderId)
    })
    return sortPalaces(pool.filter((item) => matchesQuery(item.name, item.category)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched, inArchived, atRoot, folderId, q, sort])

  const visibleFolders = useMemo<LibraryFolderItem[]>(() => {
    if (!atRoot || inArchived) return []
    const countByFolder = new Map<string, number>()
    for (const item of enriched) {
      if (item.archived || !item.folderId) continue
      countByFolder.set(item.folderId, (countByFolder.get(item.folderId) ?? 0) + 1)
    }
    const items = folders
      .filter((folder) => matchesQuery(folder.name))
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        count: countByFolder.get(folder.id) ?? 0,
        order: folder.order,
        updatedAt: folder.updatedAt,
      }))
    items.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'recent':
          return b.updatedAt.localeCompare(a.updatedAt)
        default:
          return a.order - b.order || a.name.localeCompare(b.name)
      }
    })
    return items.map(({ id, name, color, icon, count }) => ({ id, name, color, icon, count }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders, enriched, atRoot, inArchived, q, sort])

  // Once data has loaded, whether the current view has anything to show. Drives the
  // controls + speed-dial: empty views drop them, leaning on the empty state's own CTAs.
  const hasItems = palacesReady && (visibleFolders.length > 0 || visiblePalaces.length > 0)

  const palaceById = (id: string) => palaces.find((palace) => palace.id === id)
  const deletingPalace = deletePalaceTarget ? palaceById(deletePalaceTarget) : undefined
  const deletingFolder = deleteFolderTarget
    ? folders.find((folder) => folder.id === deleteFolderTarget)
    : undefined
  const movingPalace = moveTarget ? palaceById(moveTarget) : undefined

  const handleImportPalace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = await readPalaceFile(file)
      const { palace } = await importPalace(palaceStore, roomStore, locusStore, questionStore, data)
      toast.success(t('palaces.importToast', { name: palace.name }))
      onOpenPalace?.(palace.id)
    } catch (error) {
      toast.error(error instanceof ContentImportError ? error.message : t('palaces.importError'))
    }
  }

  const handleArchive = (id: string) => {
    const palace = palaceById(id)
    if (!palace) return
    const archiving = !palace.archived
    void setPalaceArchived(palaceStore, id, archiving)
    toast.success(
      t(archiving ? 'palaces.archivedToast' : 'palaces.restoredToast', { name: palace.name }),
      {
        action: {
          label: t('common.undo'),
          onClick: () => void setPalaceArchived(palaceStore, id, !archiving),
        },
      },
    )
  }

  const nextFolderColor = PALACE_COLOR_OPTIONS[folders.length % PALACE_COLOR_OPTIONS.length]!.value

  const handleSubmitFolder = (changes: { name: string; color: string; icon: string }) => {
    if (folderSheetTarget) {
      void editFolder(folderStore, folderSheetTarget, changes)
    } else {
      void createFolder(folderStore, changes)
      // Folders live at the library root (they don't nest), so a folder created while
      // inside another folder/archived view would be invisible — return to the root to
      // reveal it.
      if (!atRoot) onCloseFolder?.()
    }
    setFolderSheetOpen(false)
  }

  const filePalaceInto = (palaceId: string, targetFolderId: string | null, silent = false) => {
    const palace = palaceById(palaceId)
    const previous = palace?.folderId ?? null
    if (!palace || targetFolderId === previous) return
    void setPalaceFolder(palaceStore, palaceId, targetFolderId)
    if (silent) return
    const folderName = targetFolderId
      ? folders.find((folder) => folder.id === targetFolderId)?.name
      : undefined
    toast.success(
      folderName ? t('palaces.movedToast', { folder: folderName }) : t('palaces.unfiledToast'),
      {
        action: {
          label: t('common.undo'),
          onClick: () => void setPalaceFolder(palaceStore, palaceId, previous),
        },
      },
    )
  }

  const handlePickFolder = (targetFolderId: string | null) => {
    if (movingPalace) filePalaceInto(movingPalace.id, targetFolderId)
    setMoveTarget(null)
  }

  const handleBulkPickFolder = (targetFolderId: string | null) => {
    for (const id of selectedIds) if (palaceById(id)) filePalaceInto(id, targetFolderId, true)
    toast.success(t('palaces.bulkMovedToast'))
    setBulkMoveOpen(false)
    exitSelect()
  }

  const confirmDeletePalace = () => {
    if (deletePalaceTarget) {
      const name = deletingPalace?.name ?? ''
      void deletePalace(palaceStore, deletePalaceTarget)
      toast.success(t('palaces.deleted', { name }))
    }
    setDeletePalaceTarget(null)
  }

  const confirmDeleteFolder = () => {
    if (deleteFolderTarget) {
      void deleteFolder(folderStore, palaceStore, deleteFolderTarget)
      if (folderId === deleteFolderTarget) onCloseFolder?.()
    }
    setDeleteFolderTarget(null)
  }

  const dndHandlers: LibraryHandlers = {
    onOpenPalace: (id) => onOpenPalace?.(id),
    onOpenPalaceSettings: (id) => onOpenPalaceSettings?.(id),
    onToggleFavorite: (id) => void togglePalaceFavorite(palaceStore, id),
    onMovePalace: (id) => setMoveTarget(id),
    onArchivePalace: handleArchive,
    onDeletePalace: (id) => setDeletePalaceTarget(id),
    onOpenFolder: (id) => onOpenFolder?.(id),
    onEditFolder: (id) => {
      const folder = folders.find((f) => f.id === id)
      if (folder) openEditFolder(folder)
    },
    onDeleteFolder: (id) => setDeleteFolderTarget(id),
    onReorderFolders: (ids) => {
      void reorderFolders(folderStore, ids)
      if (sort !== 'manual') setSort('manual')
    },
    onReorderPalaces: (ids) => {
      void reorderPalaces(palaceStore, ids)
      if (sort !== 'manual') setSort('manual')
    },
    onFilePalace: (palaceId, targetFolderId) => filePalaceInto(palaceId, targetFolderId),
    onRequestSelect: (id) => {
      setSelectMode(true)
      setSelectedIds((prev) => new Set(prev).add(id))
    },
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allVisibleIds = [...visibleFolders.map((f) => f.id), ...visiblePalaces.map((p) => p.id)]
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id))
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(allVisibleIds))

  const selectedFolderIds = [...selectedIds].filter((id) => folders.some((f) => f.id === id))
  const selectedPalaceIds = [...selectedIds].filter((id) => palaces.some((p) => p.id === id))
  const onlyPalaces = selectedFolderIds.length === 0 && selectedPalaceIds.length > 0

  const confirmBulkDelete = () => {
    for (const id of selectedPalaceIds) void deletePalace(palaceStore, id)
    for (const id of selectedFolderIds) void deleteFolder(folderStore, palaceStore, id)
    toast.success(t('palaces.bulkDeletedToast', { count: selectedIds.size }))
    setBulkDeleteOpen(false)
    exitSelect()
  }

  const bulkArchive = () => {
    for (const id of selectedPalaceIds) {
      const palace = palaceById(id)
      if (palace && !palace.archived) void setPalaceArchived(palaceStore, id, true)
    }
    toast.success(t('palaces.bulkArchivedToast'))
    exitSelect()
  }

  const sortActions = (['manual', 'recent', 'progress', 'name', 'category'] as const).map(
    (option) => ({
      id: option,
      label: t(SORT_LABEL_KEY[option]),
      icon:
        sort === option ? (
          <Check className="size-5 text-primary" aria-hidden />
        ) : (
          <SortGlyph option={option} />
        ),
      onSelect: () => setSort(option),
    }),
  )

  // Sort / select / view, shared by the root toolbar and the sub-view header. Sorting leads
  // (left); selection + layout group together. `compactSort` drops the sort label where bar
  // space is tight (the in-header variant).
  const sortControl = (compactSort: boolean) => (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={t('palaces.sortLabel')}
      onClick={() => setSortOpen(true)}
      className={cn(
        'flex h-9 min-w-0 items-center gap-1.5 rounded-control border border-border bg-card shadow-rest transition-transform active:scale-[0.97]',
        compactSort ? 'px-2' : 'pl-2.5 pr-2',
      )}
    >
      <SortGlyph option={sort} className="size-4 text-accent" />
      {compactSort ? null : (
        <span className="truncate text-[length:var(--p-text-label)] font-semibold text-heading">
          {t(SORT_LABEL_KEY[sort])}
        </span>
      )}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )

  const selectControl = (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={t('palaces.selectLabel')}
      onClick={() => setSelectMode(true)}
    >
      <ListChecks className="size-[18px]" aria-hidden />
    </IconButton>
  )

  const viewControl = (
    <SegmentedControl
      aria-label={t('palaces.viewLabel')}
      size="sm"
      className="w-[76px]"
      value={view}
      onChange={(value) => setView(value)}
      options={[
        {
          value: 'grid',
          label: <LayoutGrid className="size-[18px]" aria-hidden />,
          ariaLabel: t('palaces.viewGrid'),
        },
        {
          value: 'list',
          label: <Rows3 className="size-[18px]" aria-hidden />,
          ariaLabel: t('palaces.viewList'),
        },
      ]}
    />
  )

  const emptyState = renderEmptyState()

  function emptyActions(includeFolder: boolean) {
    return (
      <div className="flex flex-col items-stretch gap-2.5">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-[18px]" aria-hidden />
          {t('palaces.createCta')}
        </Button>
        <div className="flex justify-center gap-2">
          <Button variant="ghost" onClick={() => importRef.current?.click()}>
            <Upload className="size-[18px]" aria-hidden />
            {t('palaces.import')}
          </Button>
          {includeFolder ? (
            <Button variant="ghost" onClick={openCreateFolder}>
              <FolderPlus className="size-[18px]" aria-hidden />
              {t('palaces.newFolderTitle')}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  function renderEmptyState() {
    if (query.trim()) {
      return (
        <EmptyState
          emoji="🔍"
          title={t('palaces.emptySearchTitle')}
          description={t('palaces.emptySearchBody', { query: query.trim() })}
          action={
            <Button variant="secondary" onClick={closeSearch}>
              {t('palaces.emptyFilteredAction')}
            </Button>
          }
        />
      )
    }
    if (inArchived) {
      return (
        <EmptyState
          icon={<Archive className="size-7" aria-hidden />}
          title={t('palaces.emptyArchivedTitle')}
          description={t('palaces.emptyArchivedBody')}
        />
      )
    }
    if (!atRoot) {
      return (
        <EmptyState
          emoji="📂"
          title={t('palaces.emptyFolderTitle')}
          description={t('palaces.emptyFolderBody')}
          action={emptyActions(false)}
        />
      )
    }
    return (
      <EmptyState
        emoji="🏛️"
        title={t('palaces.emptyTitle')}
        description={t('palaces.emptyBody')}
        action={emptyActions(true)}
      />
    )
  }

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={header.ref}
      header={
        atRoot ? (
          <HomeHeader
            header={header}
            name={reviewerName}
            avatar={profile.avatar}
            xp={progress?.xp ?? 0}
            unreadCount={unreadCount}
            streak={{
              count: progress?.streakCount ?? 0,
              dayCount: progress?.activeDayCount ?? 0,
              dailyGoal: prefs.dailyGoal,
            }}
            onOpenStreak={() => onOpenStreak?.()}
            onOpenProfile={() => onOpenProfile?.()}
            onOpenNotifications={() => onOpenNotifications?.()}
            onOpenArchived={() => onOpenFolder?.(ARCHIVED_VIEW)}
            search={{
              open: searchOpen,
              query,
              onOpen: () => setSearchOpen(true),
              onClose: closeSearch,
              onQueryChange: setQuery,
              label: t('palaces.searchLabel'),
              placeholder: t('palaces.searchPlaceholder'),
              closeLabel: t('palaces.closeSearch'),
            }}
          />
        ) : (
          <StickyBar elevation={header.elevation}>
            <div className="flex w-full items-center gap-2">
              <IconButton
                variant="glass"
                size="sm"
                aria-label={t('palaces.backToLibrary')}
                onClick={() => onCloseFolder?.()}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </IconButton>

              {inArchived ? (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-info-foreground">
                    <Archive className="size-[18px]" aria-hidden />
                  </span>
                  <h1 className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
                    {t('palaces.collectionArchived')}
                  </h1>
                </span>
              ) : currentFolder ? (
                <button
                  type="button"
                  onClick={() => openEditFolder(currentFolder)}
                  aria-label={t('palaces.editFolderLabel', { name: currentFolder.name })}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-control text-left"
                >
                  <FolderGlyph
                    color={currentFolder.color}
                    icon={currentFolder.icon}
                    className="size-8 shrink-0"
                    iconClassName="text-base leading-none"
                  />
                  <h1 className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
                    {currentFolder.name}
                  </h1>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              ) : (
                <span className="flex-1" />
              )}

              {hasItems && !selectMode ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  {sortControl(true)}
                  {selectControl}
                  {viewControl}
                </div>
              ) : null}
            </div>
          </StickyBar>
        )
      }
    >
      {/* The home root's heading lives in the avatar identity, not visible chrome, so the
          document still has a top-level heading for assistive tech. */}
      {atRoot ? <h1 className="sr-only">{t('palaces.libraryTitle')}</h1> : null}

      {/* Select-mode bar — replaces whatever controls a view normally shows. */}
      {selectMode ? (
        <div className="mb-3 mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[length:var(--p-text-label)] font-semibold text-heading"
          >
            {allSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
          </button>
          <span className="text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
            {t('loci.select.count', { count: selectedIds.size })}
          </span>
          <button
            type="button"
            onClick={exitSelect}
            className="ml-auto text-[length:var(--p-text-label)] font-semibold text-accent"
          >
            {t('loci.select.done')}
          </button>
        </div>
      ) : atRoot && hasItems ? (
        // Root toolbar: sorting leads on the left; selection + layout sit on the right.
        // (Archive now lives in the home header; the sub-view header carries its own controls.)
        <div className="mb-3 mt-3 flex items-center gap-2">
          {sortControl(false)}
          <div className="ml-auto flex items-center gap-1.5">
            {selectControl}
            {viewControl}
          </div>
        </div>
      ) : null}

      <LibraryGrid
        folders={visibleFolders}
        palaces={visiblePalaces}
        view={view}
        loading={!palacesReady}
        emptyState={emptyState}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        {...dndHandlers}
      />

      {/* Bulk-action bar — appears in select mode with at least one item picked. It floats
          just above the bottom nav (which sits at ~0.75rem + h-16), never behind it. */}
      {selectMode && selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-[180] mx-auto max-w-[430px] px-4">
          <div className="flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
            {onlyPalaces ? (
              <>
                <BulkButton
                  icon={<FolderPlus className="size-[17px]" aria-hidden />}
                  label={t('palaces.bulkMove')}
                  onClick={() => setBulkMoveOpen(true)}
                />
                <BulkButton
                  icon={<Archive className="size-[17px]" aria-hidden />}
                  label={t('palaces.archive')}
                  onClick={bulkArchive}
                />
              </>
            ) : null}
            <BulkButton
              tone="danger"
              icon={<Trash2 className="size-[17px]" aria-hidden />}
              label={t('common.delete')}
              onClick={() => setBulkDeleteOpen(true)}
            />
          </div>
        </div>
      ) : null}

      {/* The speed-dial is the in-view shortcut to the same actions the empty state spells
          out, so it only joins a view that already has content. */}
      {!selectMode && hasItems ? (
        <SpeedDial
          label={t('palaces.quickActions')}
          actions={[
            {
              id: 'create',
              label: t('palaces.createCta'),
              icon: <Building2 className="size-5" aria-hidden />,
              onSelect: () => setCreateOpen(true),
            },
            {
              id: 'import',
              label: t('palaces.import'),
              icon: <Upload className="size-5" aria-hidden />,
              onSelect: () => importRef.current?.click(),
            },
            {
              id: 'folder',
              label: t('palaces.newFolderTitle'),
              icon: <FolderPlus className="size-5" aria-hidden />,
              onSelect: openCreateFolder,
            },
          ]}
        />
      ) : null}

      <ActionSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title={t('palaces.sortBy')}
        actions={sortActions}
        cancelLabel={t('common.cancel')}
      />

      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportPalace}
      />

      <CreatePalaceSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(_id, name) => toast.success(t('palaces.createdToast', { name }))}
        folderId={atRoot || inArchived ? null : folderId}
      />

      <MoveToFolderSheet
        open={moveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null)
        }}
        palaceName={movingPalace?.name ?? ''}
        currentFolderId={movingPalace?.folderId ?? null}
        folders={folders}
        onPick={handlePickFolder}
        onNewFolder={() => {
          setMoveTarget(null)
          openCreateFolder()
        }}
      />

      <MoveToFolderSheet
        open={bulkMoveOpen}
        onOpenChange={setBulkMoveOpen}
        palaceName={t('palaces.bulkSelected', { count: selectedPalaceIds.length })}
        currentFolderId={atRoot ? null : folderId}
        folders={folders}
        onPick={handleBulkPickFolder}
        onNewFolder={() => {
          setBulkMoveOpen(false)
          openCreateFolder()
        }}
      />

      <FolderSheet
        open={folderSheetOpen}
        onOpenChange={setFolderSheetOpen}
        folder={folderSheetTarget}
        defaultColor={nextFolderColor}
        onSubmit={handleSubmitFolder}
        onDelete={
          folderSheetTarget
            ? () => {
                const id = folderSheetTarget.id
                setFolderSheetOpen(false)
                setDeleteFolderTarget(id)
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={deletePalaceTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePalaceTarget(null)
        }}
        icon={<Trash2 className="size-7" aria-hidden />}
        title={t('palaces.deleteConfirmTitle', { name: deletingPalace?.name ?? '' })}
        description={t('palaces.deleteConfirmBody')}
        confirmLabel={t('palaces.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeletePalace}
      />

      <ConfirmDialog
        open={deleteFolderTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFolderTarget(null)
        }}
        title={t('palaces.deleteFolderTitle', { name: deletingFolder?.name ?? '' })}
        description={t('palaces.deleteFolderBody')}
        confirmLabel={t('palaces.confirmDeleteFolder')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteFolder}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        icon={<Trash2 className="size-7" aria-hidden />}
        title={t('palaces.bulkDeleteTitle', { count: selectedIds.size })}
        description={t('palaces.bulkDeleteBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmBulkDelete}
      />
    </AppScreen>
  )
}

function SortGlyph({
  option,
  className = 'size-5 text-heading',
}: {
  option: PalacesSort
  className?: string
}) {
  if (option === 'manual') return <GripVertical className={className} aria-hidden />
  if (option === 'progress') return <TrendingUp className={className} aria-hidden />
  if (option === 'name') return <ArrowDownAZ className={className} aria-hidden />
  if (option === 'category') return <Tag className={className} aria-hidden />
  return <Clock className={className} aria-hidden />
}

function BulkButton({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-control text-[length:var(--p-text-label)] font-semibold transition-transform active:scale-[0.97]',
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
