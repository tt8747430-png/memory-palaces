import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Archive,
  Building2,
  Check,
  ChevronDown,
  Clock,
  FolderPlus,
  LayoutGrid,
  Pencil,
  Plus,
  Rows3,
  Tag,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  ContentImportError,
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
  setPalaceArchived,
  setPalaceFolder,
  togglePalaceFavorite,
  CreatePalaceSheet,
} from '@/features/palace'
import { readPalaceFile } from '@/features/content'
import { createFolder, deleteFolder, editFolder } from '@/features/folder'
import { setPreferences } from '@/features/preferences'
import { PalaceList, type PalaceListItem } from '@/widgets/palace-list'
import { HomeHeader } from '@/widgets/home-header'
import {
  ActionSheet,
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyState,
  SegmentedControl,
  SpeedDial,
} from '@/shared/ui'
import { CollectionRail, FolderGlyph, type Collection } from './CollectionRail'
import { FolderSheet, MoveToFolderSheet } from './PalaceSheets'

export interface PalacesPageProps {
  /** Open a palace's detail; wired by the route wrapper. */
  onOpenPalace?: (id: string) => void
  /** Open a palace's settings directly from its overflow menu; wired by the route wrapper. */
  onOpenPalaceSettings?: (id: string) => void
  /** Open the create sheet on mount (a `?create` deep link still opens it). */
  openCreate?: boolean
  /** Open the profile screen; wired by the route wrapper. */
  onOpenProfile?: () => void
  /** Open notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the streak screen from the header ring; wired by the route wrapper. */
  onOpenStreak?: () => void
}

// Built-in collection ids. Folder ids are UUIDs, so they never collide with these.
const ALL = 'all'
const FAVORITES = 'favorites'
const BIBLE = 'bible'
const UNFILED = 'unfiled'
const ARCHIVED = 'archived'

const SORT_LABEL_KEY = {
  recent: 'palaces.sortRecent',
  progress: 'palaces.sortProgress',
  name: 'palaces.sortName',
  category: 'palaces.sortCategory',
} as const satisfies Record<PalacesSort, string>

/** Palaces screen — browse, search, sort, and organise palaces into folders. Reactive
 * off RxDB; every action persists offline through the injected stores. Progress is
 * derived from each palace's rooms/loci, the same way the home overview derives it. */
export function PalacesPage({
  onOpenPalace,
  onOpenPalaceSettings,
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

  // Snapshot the clock once so the review hero, up-next picker, and per-palace due badges
  // all agree within a render pass; the RxDB stores keep the data itself live.
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

  const view = prefs.palacesView
  const sort = prefs.palacesSort
  const setView = (value: PalacesView) => void setPreferences(prefStore, { palacesView: value })
  const setSort = (value: PalacesSort) => void setPreferences(prefStore, { palacesSort: value })

  const [activeFilter, setActiveFilter] = useState<string>(ALL)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(openCreate)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  // One sheet drives the whole folder lifecycle: `open` with a `null` target is create,
  // with a folder is edit.
  const [folderSheetOpen, setFolderSheetOpen] = useState(false)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null>(null)
  const [deletePalaceTarget, setDeletePalaceTarget] = useState<string | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null)

  const openCreateFolder = () => {
    setFolderSheetTarget(null)
    setFolderSheetOpen(true)
  }
  const openEditFolder = (folder: Folder) => {
    setFolderSheetTarget(folder)
    setFolderSheetOpen(true)
  }

  // Cards due now, per palace — recomputed when the library changes. The clock is read once
  // at the UI edge (`now`); the pure tally lives in shared/lib and takes it as an argument.
  const dueCounts = useMemo(
    () => countDuePerPalace(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )

  const reviewerName = profile.name.trim() || session?.displayName || t('common.guest')

  // Map each palace to its list item, deriving progress from its rooms/loci.
  const items = useMemo<PalaceListItem[]>(
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
          bibleMode: palace.bibleMode,
          archived: palace.archived,
          folderId: palace.folderId,
          updatedAt: palace.updatedAt,
          progress: palaceProgress(completions),
          roomsCompleted: completions.filter(Boolean).length,
          totalRooms: completions.length,
          dueCount: dueCounts.get(palace.id) ?? 0,
        }
      }),
    [palaces, rooms, loci, dueCounts],
  )

  const active = useMemo(() => items.filter((item) => !item.archived), [items])
  const favoriteCount = active.filter((item) => item.favorite).length
  const bibleCount = active.filter((item) => item.bibleMode).length
  const unfiledCount = active.filter((item) => !item.folderId).length
  const archivedCount = items.length - active.length

  const collections = useMemo<Collection[]>(() => {
    const base: Collection[] = [
      { id: ALL, label: t('palaces.collectionAll'), count: active.length, kind: 'all' },
    ]
    if (favoriteCount > 0) {
      base.push({
        id: FAVORITES,
        label: t('palaces.collectionFavorites'),
        count: favoriteCount,
        kind: 'favorites',
      })
    }
    if (bibleCount > 0) {
      base.push({
        id: BIBLE,
        label: t('palaces.collectionBible'),
        count: bibleCount,
        kind: 'bible',
      })
    }
    folders.forEach((folder) => {
      base.push({
        id: folder.id,
        label: folder.name,
        count: active.filter((item) => item.folderId === folder.id).length,
        kind: 'folder',
        color: folder.color,
        icon: folder.icon,
      })
    })
    if (folders.length > 0 && unfiledCount > 0) {
      base.push({
        id: UNFILED,
        label: t('palaces.collectionUnfiled'),
        count: unfiledCount,
        kind: 'unfiled',
      })
    }
    if (archivedCount > 0) {
      base.push({
        id: ARCHIVED,
        label: t('palaces.collectionArchived'),
        count: archivedCount,
        kind: 'archived',
      })
    }
    return base
  }, [t, active, favoriteCount, bibleCount, folders, unfiledCount, archivedCount])

  const isArchivedView = activeFilter === ARCHIVED

  const visible = useMemo(() => {
    let list = isArchivedView ? items.filter((item) => item.archived) : active
    if (activeFilter === FAVORITES) list = list.filter((item) => item.favorite)
    else if (activeFilter === BIBLE) list = list.filter((item) => item.bibleMode)
    else if (activeFilter === UNFILED) list = list.filter((item) => !item.folderId)
    else if (activeFilter !== ALL && !isArchivedView)
      list = list.filter((item) => item.folderId === activeFilter)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
      )
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'progress':
          return b.progress - a.progress
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        default:
          // Recent: favorites float to the top, then newest-updated first.
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    })
  }, [items, active, activeFilter, isArchivedView, query, sort])

  const palaceById = (id: string) => palaces.find((palace) => palace.id === id)
  const deletingPalace = deletePalaceTarget ? palaceById(deletePalaceTarget) : undefined
  const deletingFolder = deleteFolderTarget
    ? folders.find((folder) => folder.id === deleteFolderTarget)
    : undefined
  const movingPalace = moveTarget ? palaceById(moveTarget) : undefined
  const activeFolder = folders.find((folder) => folder.id === activeFilter)

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  // Archive (and move, below) are reversible, so they confirm with an undoable toast
  // rather than a blocking dialog — the action lands instantly and stays forgiving.
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

  // Cycle the shared palette so each new folder lands on a fresh colour by default.
  const nextFolderColor = PALACE_COLOR_OPTIONS[folders.length % PALACE_COLOR_OPTIONS.length]!.value

  const handleSubmitFolder = (changes: { name: string; color: string; icon: string }) => {
    if (folderSheetTarget) void editFolder(folderStore, folderSheetTarget, changes)
    else void createFolder(folderStore, changes)
    setFolderSheetOpen(false)
  }

  const handlePickFolder = (folderId: string | null) => {
    const palace = movingPalace
    const previous = palace?.folderId ?? null
    if (palace && folderId !== previous) {
      void setPalaceFolder(palaceStore, palace.id, folderId)
      const folderName = folderId
        ? folders.find((folder) => folder.id === folderId)?.name
        : undefined
      toast.success(
        folderName ? t('palaces.movedToast', { folder: folderName }) : t('palaces.unfiledToast'),
        {
          action: {
            label: t('common.undo'),
            onClick: () => void setPalaceFolder(palaceStore, palace.id, previous),
          },
        },
      )
    }
    setMoveTarget(null)
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
      if (activeFilter === deleteFolderTarget) setActiveFilter(ALL)
    }
    setDeleteFolderTarget(null)
  }

  const sortActions = (['recent', 'progress', 'name', 'category'] as const).map((option) => ({
    id: option,
    label: t(SORT_LABEL_KEY[option]),
    icon:
      sort === option ? (
        <Check className="size-5 text-primary" aria-hidden />
      ) : (
        <SortGlyph option={option} />
      ),
    onSelect: () => setSort(option),
  }))

  const emptyState = renderEmptyState()

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
    if (isArchivedView) {
      return (
        <EmptyState
          icon={<Archive className="size-7" aria-hidden />}
          title={t('palaces.emptyArchivedTitle')}
          description={t('palaces.emptyArchivedBody')}
        />
      )
    }
    if (active.length === 0) {
      return (
        <EmptyState
          emoji="🏛️"
          title={t('palaces.emptyTitle')}
          description={t('palaces.emptyBody')}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-[18px]" aria-hidden />
              {t('palaces.createCta')}
            </Button>
          }
        />
      )
    }
    return (
      <EmptyState
        emoji="🗂️"
        title={t('palaces.emptyFilteredTitle')}
        description={t('palaces.emptyFilteredBody')}
        action={
          <Button variant="secondary" onClick={() => setActiveFilter(ALL)}>
            {t('palaces.emptyFilteredAction')}
          </Button>
        }
      />
    )
  }

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={header.ref}
      header={
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
      }
    >
      <div className="mt-6">
        <CollectionRail
          collections={collections}
          activeId={activeFilter}
          onSelect={setActiveFilter}
          onNewFolder={openCreateFolder}
        />
      </div>

      {/* Two-tier overview: a context line names what you're looking at (a result count, or
          inside a folder a tappable header that owns rename / recolour / delete), then a
          control bar makes the sort visible — no longer hidden behind a mystery icon — next
          to the grid/list toggle. */}
      <div className="mb-3 mt-5 flex flex-col gap-3">
        {activeFolder ? (
          <button
            type="button"
            onClick={() => openEditFolder(activeFolder)}
            aria-label={t('palaces.editFolderLabel', { name: activeFolder.name })}
            className="flex min-w-0 items-center gap-2.5 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <FolderGlyph
              color={activeFolder.color}
              icon={activeFolder.icon}
              className="size-7"
              iconClassName="text-sm leading-none"
            />
            <span className="truncate text-[length:var(--p-text-headline)] font-bold tracking-tight text-heading">
              {activeFolder.name}
            </span>
            <span className="shrink-0 rounded-full bg-info-surface px-2 py-0.5 text-[length:var(--p-text-label)] font-bold tabular-nums text-info-foreground">
              {visible.length}
            </span>
            <Pencil className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ) : (
          <h2 className="min-w-0 truncate text-[length:var(--p-text-headline)] font-bold tracking-tight text-heading">
            {isArchivedView
              ? t('palaces.collectionArchived')
              : t(visible.length === 1 ? 'palaces.countOne' : 'palaces.countOther', {
                  count: visible.length,
                })}
          </h2>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t('palaces.sortLabel')}
            onClick={() => setSortOpen(true)}
            className="flex h-9 min-w-0 items-center gap-1.5 rounded-control border border-border bg-card pl-2.5 pr-2 shadow-rest transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <SortGlyph option={sort} className="size-4 text-accent" />
            <span className="truncate text-[length:var(--p-text-label)] font-semibold text-heading">
              {t(SORT_LABEL_KEY[sort])}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>

          <SegmentedControl
            aria-label={t('palaces.viewLabel')}
            size="sm"
            className="ml-auto w-[88px]"
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
        </div>
      </div>

      <PalaceList
        items={visible}
        view={view}
        loading={!palacesReady}
        emptyState={emptyState}
        onOpen={(id) => onOpenPalace?.(id)}
        onOpenSettings={(id) => onOpenPalaceSettings?.(id)}
        onToggleFavorite={(id) => void togglePalaceFavorite(palaceStore, id)}
        onMove={(id) => setMoveTarget(id)}
        onArchive={handleArchive}
        onDelete={(id) => setDeletePalaceTarget(id)}
      />

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
        onCreated={(id) => onOpenPalace?.(id)}
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
        icon={<Archive className="size-7" aria-hidden />}
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
  if (option === 'progress') return <TrendingUp className={className} aria-hidden />
  if (option === 'name') return <ArrowDownAZ className={className} aria-hidden />
  if (option === 'category') return <Tag className={className} aria-hidden />
  return <Clock className={className} aria-hidden />
}
