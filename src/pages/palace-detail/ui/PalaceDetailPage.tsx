import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Clock,
  GripVertical,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import {
  roomsForPalace,
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  deleteRoom,
  duplicateRoom,
  reorderRooms,
  RoomEditorSheet,
  type RoomEditorTarget,
} from '@/features/room'
import { resetRoomSrs } from '@/features/locus'
import {
  type RoomsSort,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { ImportRoomsSheet } from '@/features/content'
import {
  cn,
  isDue,
  isLocusReviewed,
  isRoomCompleted,
  roomProgress,
  srsStatus,
  studyOverview,
} from '@/shared/lib'
import { RoomList, type RoomListItem } from '@/widgets/room-list'
import { PracticeModes } from '@/widgets/practice-modes'
import {
  AppScreen,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ScreenHeader,
  SortControl,
  type SortControlOption,
  SpeedDial,
  StudyOverviewCard,
} from '@/shared/ui'

export interface PalaceDetailPageProps {
  palaceId: string
  /** Provided by the route wrapper (kept out of the component so it stays router-free). */
  onBack?: () => void
  /** Open a room's hub; wired by the route wrapper. */
  onOpenRoom?: (roomId: string) => void
  /** Open this palace's settings; wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open the palace-wide Study-cards session. */
  onStudyPalace?: () => void
  /** Launch the palace-wide Match game. */
  onMatch?: () => void
  /** Launch the palace-wide quiz (Test). */
  onTest?: () => void
  /** Launch palace-wide verse study (Bible-mode palaces only). */
  onVerse?: () => void
}

/** Palace detail — the palace-scoped study overview and practice modes above its ordered
 * rooms, the place to create, edit, reorder, and delete them. Identity lives in the header
 * and palace settings. Reactive off RxDB; every action persists offline through the
 * injected stores. */
export function PalaceDetailPage({
  palaceId,
  onBack,
  onOpenRoom,
  onOpenSettings,
  onStudyPalace,
  onMatch,
  onTest,
  onVerse,
}: PalaceDetailPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const prefStore = usePreferencesStoreApi()

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    prefStore.getState().start()
  }, [palaceStore, roomStore, locusStore, questionStore, prefStore])

  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
  const allRooms = useRoomStore(selectRooms)
  const allLoci = useLocusStore(selectLoci)
  const allQuestions = useQuestionStore(selectQuestions)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && lociReady && questionsReady

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const roomsSort = prefs.roomsSort
  const setRoomsSort = (value: RoomsSort) => void setPreferences(prefStore, { roomsSort: value })

  const rooms = useMemo(() => roomsForPalace(allRooms, palaceId), [allRooms, palaceId])

  // Built in the manual route order; `position` is the room's permanent place along the
  // journey (it never renumbers when the view is sorted some other way). `createdAt` rides
  // along as a sort key.
  type EnrichedRoom = RoomListItem & { createdAt: string }
  const items = useMemo<EnrichedRoom[]>(() => {
    const now = Date.now()
    return rooms.map((room, index) => {
      const loci = lociForRoom(allLoci, room.id)
      const questions = questionsForRoom(allQuestions, room.id)
      let reviewed = 0
      let known = 0
      let due = 0
      for (const locus of loci) {
        if (isLocusReviewed(locus)) reviewed += 1
        if (srsStatus(locus.srs) === 'known') known += 1
        if (isDue(locus.srs, now)) due += 1
      }
      return {
        id: room.id,
        title: room.title,
        description: room.description,
        position: index + 1,
        createdAt: room.createdAt,
        lociCount: loci.length,
        questionCount: questions.length,
        knownCount: known,
        dueCount: due,
        reviewedCount: reviewed,
        progress: roomProgress(loci),
        completed: isRoomCompleted(loci),
      }
    })
  }, [rooms, allLoci, allQuestions])

  // The list as shown: `manual` keeps the route order; the rest are automatic rules. A
  // drag (only offered in manual) reorders the stored route, so the view never fights it.
  const displayItems = useMemo<RoomListItem[]>(() => {
    if (roomsSort === 'manual') return items
    return [...items].sort((a, b) => {
      switch (roomsSort) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'progress':
          return b.progress - a.progress || a.position - b.position
        case 'recent':
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
  }, [items, roomsSort])

  const roomsSortOptions: SortControlOption<RoomsSort>[] = [
    { value: 'manual', label: t('rooms.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('rooms.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'progress', label: t('rooms.sort.progress'), icon: <TrendingUp className="size-4" /> },
    { value: 'name', label: t('rooms.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
  ]

  const summary = useMemo(() => {
    return {
      totalRooms: items.length,
      totalLoci: items.reduce((sum, item) => sum + item.lociCount, 0),
      totalQuestions: items.reduce((sum, item) => sum + item.questionCount, 0),
    }
  }, [items])

  const dueAcrossPalace = useMemo(() => {
    const now = Date.now()
    const roomIds = new Set(rooms.map((room) => room.id))
    const palaceLoci = allLoci.filter((locus) => roomIds.has(locus.roomId))
    return studyOverview(palaceLoci, now)
  }, [rooms, allLoci])

  const [editorTarget, setEditorTarget] = useState<RoomEditorTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkResetOpen, setBulkResetOpen] = useState(false)

  const roomById = (id: string) => rooms.find((room) => room.id === id)
  const deletingRoom = deleteTarget ? roomById(deleteTarget) : undefined
  const resettingRoom = resetTarget ? roomById(resetTarget) : undefined

  const handleDuplicate = async (id: string) => {
    await duplicateRoom(roomStore, locusStore, questionStore, id)
    toast.success(t('rooms.toast.duplicated'))
  }

  // Long-press enters select mode with the pressed room already picked; a grip-drag then
  // reorders the route (forcing manual sort, since a hand-arranged order only makes sense
  // against the manual rule).
  const requestSelect = (id: string) => {
    setSelectMode(true)
    setSelectedIds((prev) => new Set(prev).add(id))
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
  const allSelected =
    displayItems.length > 0 && displayItems.every((room) => selectedIds.has(room.id))
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(displayItems.map((room) => room.id)))

  const handleReorder = (orderedIds: string[]) => {
    void reorderRooms(roomStore, orderedIds)
    if (roomsSort !== 'manual') setRoomsSort('manual')
  }

  const confirmBulkDelete = () => {
    for (const id of selectedIds) void deleteRoom(roomStore, id)
    toast.success(t('rooms.toast.bulkDeleted', { count: selectedIds.size }))
    setBulkDeleteOpen(false)
    exitSelect()
  }
  const confirmBulkReset = () => {
    for (const id of selectedIds) void resetRoomSrs(locusStore, id)
    toast.success(t('rooms.toast.bulkReset', { count: selectedIds.size }))
    setBulkResetOpen(false)
    exitSelect()
  }

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!palace) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('palaceDetail.notFound')}
            onBack={onBack}
            backLabel={t('palaceDetail.back')}
          />
        }
      />
    )
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={palace.name}
          subtitle={t(
            summary.totalRooms === 1
              ? 'palaceDetail.roomSummaryOne'
              : 'palaceDetail.roomSummaryOther',
            {
              count: summary.totalRooms,
            },
          )}
          onBack={onBack}
          backLabel={t('palaceDetail.back')}
          action={
            onOpenSettings ? (
              <IconButton
                variant="glass"
                aria-label={t('palaceDetail.settingsLabel')}
                onClick={onOpenSettings}
              >
                <Settings2 className="size-5" aria-hidden />
              </IconButton>
            ) : undefined
          }
        />
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {summary.totalLoci > 0 ? (
          <StudyOverviewCard
            count={dueAcrossPalace.count}
            breakdown={dueAcrossPalace.breakdown}
            onStudy={() => onStudyPalace?.()}
            onStudyAhead={onStudyPalace}
            scope="palace"
          />
        ) : null}

        {items.length > 0 ? (
          <PracticeModes
            cardCount={summary.totalLoci}
            questionCount={summary.totalQuestions}
            onVerse={onVerse}
            onMatch={onMatch}
            onTest={onTest}
          />
        ) : null}

        <section aria-label={t('palaceDetail.roomsHeading')}>
          {selectMode ? (
            // Select-mode bar — replaces the heading + sort while picking rooms. Reuses the
            // shared select strings (select-all · count · done) the library already uses.
            <div className="mb-3 flex items-center gap-3 px-0.5">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-(length:--p-text-label) font-semibold text-heading"
              >
                {allSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
              </button>
              <span className="text-(length:--p-text-label) font-semibold text-muted-foreground">
                {t('loci.select.count', { count: selectedIds.size })}
              </span>
              <button
                type="button"
                onClick={exitSelect}
                className="ml-auto text-(length:--p-text-label) font-semibold text-accent"
              >
                {t('loci.select.done')}
              </button>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
              <h2 className="text-(length:--p-text-title) font-semibold text-heading">
                {t('palaceDetail.roomsHeading')}
              </h2>
              {items.length > 1 ? (
                <SortControl
                  label={t('rooms.sortLabel')}
                  value={roomsSort}
                  options={roomsSortOptions}
                  onChange={setRoomsSort}
                />
              ) : null}
            </div>
          )}

          {items.length === 0 ? (
            <EmptyState
              emoji="🚪"
              title={t('palaceDetail.emptyTitle')}
              description={t('palaceDetail.emptyHint')}
            />
          ) : (
            <RoomList
              rooms={displayItems}
              swipe={prefs.swipe.room}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onRequestSelect={requestSelect}
              onOpen={(id) => onOpenRoom?.(id)}
              onEdit={(id) => {
                const room = roomById(id)
                if (room) setEditorTarget({ mode: 'edit', room })
              }}
              onReorder={handleReorder}
              onDuplicate={(id) => void handleDuplicate(id)}
              onResetProgress={(id) => setResetTarget(id)}
              onDelete={(id) => setDeleteTarget(id)}
            />
          )}
        </section>
      </div>

      {/* Bulk-action bar — appears in select mode with at least one room picked, floating
          just above the safe area (this detail route hides the bottom nav). */}
      {selectMode && selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)] z-180 mx-auto max-w-[430px] px-4">
          <div className="flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
            <BulkButton
              icon={<RotateCcw className="size-[17px]" aria-hidden />}
              label={t('rooms.menu.reset')}
              onClick={() => setBulkResetOpen(true)}
            />
            <BulkButton
              tone="danger"
              icon={<Trash2 className="size-[17px]" aria-hidden />}
              label={t('common.delete')}
              onClick={() => setBulkDeleteOpen(true)}
            />
          </div>
        </div>
      ) : null}

      <ImportRoomsSheet
        palaceId={palaceId}
        roomStore={roomStore}
        locusStore={locusStore}
        questionStore={questionStore}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <RoomEditorSheet
        store={roomStore}
        target={editorTarget}
        onOpenChange={(open) => {
          if (!open) setEditorTarget(null)
        }}
        onSaved={(room) =>
          toast.success(
            editorTarget?.mode === 'edit'
              ? t('rooms.toast.updated')
              : t('rooms.toast.added', { title: room.title }),
          )
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('rooms.deleteConfirm.title', { title: deletingRoom?.title ?? '' })}
        description={t('rooms.deleteConfirm.body')}
        confirmLabel={t('rooms.deleteConfirm.confirm')}
        cancelLabel={t('rooms.deleteConfirm.cancel')}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteRoom(roomStore, deleteTarget)
            toast.success(t('rooms.toast.deleted'))
          }
        }}
      />

      <ConfirmDialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null)
        }}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('rooms.resetConfirm.title', { title: resettingRoom?.title ?? '' })}
        description={t('rooms.resetConfirm.body')}
        confirmLabel={t('rooms.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (resetTarget) {
            void resetRoomSrs(locusStore, resetTarget)
            toast.success(t('rooms.toast.reset'))
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('rooms.bulkDelete.title', { count: selectedIds.size })}
        description={t('rooms.bulkDelete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkDelete}
      />

      <ConfirmDialog
        open={bulkResetOpen}
        onOpenChange={setBulkResetOpen}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('rooms.bulkReset.title', { count: selectedIds.size })}
        description={t('rooms.bulkReset.body')}
        confirmLabel={t('rooms.menu.reset')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkReset}
      />

      {/* The persistent add affordance — present at every level (empty or full), so the
          empty state can stay teaching-only with no inline buttons. Hidden while selecting,
          where the bulk bar owns the bottom of the screen. */}
      {!selectMode ? (
        <SpeedDial
          label={t('palaceDetail.quickActions')}
          className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
          actions={[
            {
              id: 'room',
              label: t('palaceDetail.addRoom'),
              icon: <Plus className="size-5" aria-hidden />,
              onSelect: () => setEditorTarget({ mode: 'add', palaceId }),
            },
            {
              id: 'import',
              label: t('importRooms.open'),
              icon: <Upload className="size-5" aria-hidden />,
              onSelect: () => setImportOpen(true),
            },
          ]}
        />
      ) : null}
    </AppScreen>
  )
}

function BulkButton({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-control text-(length:--p-text-label) font-semibold transition-transform active:scale-[0.97]',
        tone === 'danger'
          ? 'bg-(--danger-surface) text-(--danger-on-surface)'
          : 'bg-info-surface text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
