import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Archive,
  Check,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react'
import { ContentImportError, isRoomCompleted, palaceProgress, useStickyHeader } from '@/shared/lib'
import {
  PALACE_COLOR_OPTIONS,
  selectIsReady,
  selectPalaces,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { selectFolders, useFolderStore, useFolderStoreApi } from '@/entities/folder'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { useQuestionStoreApi } from '@/entities/question'
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
import { createFolder, deleteFolder } from '@/features/folder'
import { setPreferences } from '@/features/preferences'
import { PalaceList, type PalaceListItem } from '@/widgets/palace-list'
import {
  ActionSheet,
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  SegmentedControl,
  StickyBar,
  TextField,
} from '@/shared/ui'
import { CollectionRail, type Collection } from './CollectionRail'
import { MoveToFolderSheet, NewFolderSheet } from './PalaceSheets'

export interface PalacesPageProps {
  /** Open a palace's detail; wired by the route wrapper. */
  onOpenPalace?: (id: string) => void
  /** Open the create sheet on mount (the home's "Create palace" CTA arrives via ?create). */
  openCreate?: boolean
}

// Built-in collection ids. Folder ids are UUIDs, so they never collide with these.
const ALL = 'all'
const FAVORITES = 'favorites'
const BIBLE = 'bible'
const UNFILED = 'unfiled'
const ARCHIVED = 'archived'

const NEW_FOLDER_ICON = '📁'

const SORT_LABEL_KEY = {
  recent: 'palaces.sortRecent',
  progress: 'palaces.sortProgress',
  name: 'palaces.sortName',
  category: 'palaces.sortCategory',
} as const satisfies Record<PalacesSort, string>

/** Palaces screen — browse, search, sort, and organise palaces into folders. Reactive
 * off RxDB; every action persists offline through the injected stores. Progress is
 * derived from each palace's rooms/loci, the same way the home overview derives it. */
export function PalacesPage({ onOpenPalace, openCreate = false }: PalacesPageProps = {}) {
  const { t } = useTranslation()
  const header = useStickyHeader()

  const palaceStore = usePalaceStoreApi()
  const folderStore = useFolderStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const prefStore = usePreferencesStoreApi()
  const importRef = useRef<HTMLInputElement>(null)

  const palaces = usePalaceStore(selectPalaces)
  const palacesReady = usePalaceStore(selectIsReady)
  const folders = useFolderStore(selectFolders)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const prefs = usePreferencesStore(selectEffectivePreferences)

  useEffect(() => {
    palaceStore.getState().start()
    folderStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    prefStore.getState().start()
  }, [palaceStore, folderStore, roomStore, locusStore, questionStore, prefStore])

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
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [deletePalaceTarget, setDeletePalaceTarget] = useState<string | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null)

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
        }
      }),
    [palaces, rooms, loci],
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
      base.push({ id: BIBLE, label: t('palaces.collectionBible'), count: bibleCount, kind: 'bible' })
    }
    folders.forEach((folder) => {
      base.push({
        id: folder.id,
        label: folder.name,
        count: active.filter((item) => item.folderId === folder.id).length,
        kind: 'folder',
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
        (item) =>
          item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
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

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  const handleArchive = (id: string) => {
    const palace = palaceById(id)
    if (palace) void setPalaceArchived(palaceStore, id, !palace.archived)
  }

  const handleCreateFolder = (name: string) => {
    const color = PALACE_COLOR_OPTIONS[folders.length % PALACE_COLOR_OPTIONS.length]!.value
    void createFolder(folderStore, { name, color, icon: NEW_FOLDER_ICON })
    setNewFolderOpen(false)
  }

  const handlePickFolder = (folderId: string | null) => {
    if (moveTarget) void setPalaceFolder(palaceStore, moveTarget, folderId)
    setMoveTarget(null)
  }

  const confirmDeletePalace = () => {
    if (deletePalaceTarget) void deletePalace(palaceStore, deletePalaceTarget)
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
        <StickyBar elevation={header.elevation}>
          {searchOpen ? (
            <div className="flex w-full items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <TextField
                  aria-label={t('palaces.searchLabel')}
                  placeholder={t('palaces.searchPlaceholder')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoFocus
                  enterKeyHint="search"
                  className="pl-9"
                />
              </div>
              <IconButton variant="ghost" aria-label={t('palaces.closeSearch')} onClick={closeSearch}>
                <X className="size-5" aria-hidden />
              </IconButton>
            </div>
          ) : (
            <>
              <h1 className="text-[length:var(--p-text-headline)] font-bold text-heading">
                {t('nav.palaces')}
              </h1>
              <div className="flex items-center gap-1">
                <IconButton
                  variant="ghost"
                  aria-label={t('palaces.searchLabel')}
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="size-5" aria-hidden />
                </IconButton>
                <IconButton
                  variant="ghost"
                  aria-label={t('palaces.import')}
                  onClick={() => importRef.current?.click()}
                >
                  <Upload className="size-5" aria-hidden />
                </IconButton>
                <IconButton
                  variant="solid"
                  aria-label={t('palaces.createCta')}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-5" aria-hidden />
                </IconButton>
              </div>
            </>
          )}
        </StickyBar>
      }
    >
      <div className="mt-4">
        <CollectionRail
          collections={collections}
          activeId={activeFilter}
          onSelect={setActiveFilter}
          onNewFolder={() => setNewFolderOpen(true)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SegmentedControl
          aria-label={t('palaces.viewLabel')}
          className="w-[148px]"
          value={view}
          onChange={(value) => setView(value)}
          options={[
            { value: 'grid', label: t('palaces.viewGrid') },
            { value: 'list', label: t('palaces.viewList') },
          ]}
        />
        <IconButton
          variant="ghost"
          className="ml-auto"
          aria-label={t('palaces.sortLabel')}
          aria-haspopup="dialog"
          onClick={() => setSortOpen(true)}
        >
          <SlidersHorizontal className="size-5" aria-hidden />
        </IconButton>
      </div>

      <div className="mb-3 mt-3 flex items-center justify-between px-0.5">
        <p className="text-[length:var(--p-text-body)] font-semibold text-heading">
          {isArchivedView
            ? t('palaces.collectionArchived')
            : t(visible.length === 1 ? 'palaces.countOne' : 'palaces.countOther', {
                count: visible.length,
              })}
        </p>
        <div className="flex items-center gap-3">
          {sort !== 'recent' ? (
            <p className="text-[length:var(--p-text-label)]">
              {t('palaces.sortedBy', { sort: t(SORT_LABEL_KEY[sort]) })}
            </p>
          ) : null}
          {folders.some((folder) => folder.id === activeFilter) ? (
            <button
              type="button"
              onClick={() => setDeleteFolderTarget(activeFilter)}
              className="text-[length:var(--p-text-label)] font-semibold text-[var(--danger-on-surface)]"
            >
              {t('palaces.confirmDeleteFolder')}
            </button>
          ) : null}
        </div>
      </div>

      <PalaceList
        items={visible}
        view={view}
        loading={!palacesReady}
        emptyState={emptyState}
        onOpen={(id) => onOpenPalace?.(id)}
        onToggleFavorite={(id) => void togglePalaceFavorite(palaceStore, id)}
        onMove={(id) => setMoveTarget(id)}
        onArchive={handleArchive}
        onDelete={(id) => setDeletePalaceTarget(id)}
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
          setNewFolderOpen(true)
        }}
      />

      <NewFolderSheet open={newFolderOpen} onOpenChange={setNewFolderOpen} onCreate={handleCreateFolder} />

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

function SortGlyph({ option }: { option: PalacesSort }) {
  const className = 'size-5 text-heading'
  if (option === 'progress') return <TrendingUp className={className} aria-hidden />
  if (option === 'name') return <ArrowDownAZ className={className} aria-hidden />
  if (option === 'category') return <Tag className={className} aria-hidden />
  return <Clock className={className} aria-hidden />
}
