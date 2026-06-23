import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, RotateCcw, Settings2, Trash2, Upload } from 'lucide-react'
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
  moveRoom,
  RoomEditorSheet,
  type RoomEditorTarget,
} from '@/features/room'
import { resetRoomSrs } from '@/features/locus'
import { ImportRoomsSheet } from '@/features/content'
import {
  cardMaturityCounts,
  isDue,
  isLocusReviewed,
  isRoomCompleted,
  roomProgress,
  srsStatus,
} from '@/shared/lib'
import { RoomList, type RoomListItem } from '@/widgets/room-list'
import { PracticeModes } from '@/widgets/practice-modes'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ScreenHeader,
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

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
  }, [palaceStore, roomStore, locusStore, questionStore])

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

  const rooms = useMemo(() => roomsForPalace(allRooms, palaceId), [allRooms, palaceId])

  const items = useMemo<RoomListItem[]>(() => {
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
    const due = palaceLoci.filter((locus) => isDue(locus.srs, now))
    return { dueCount: due.length, breakdown: cardMaturityCounts(due) }
  }, [rooms, allLoci])

  const [editorTarget, setEditorTarget] = useState<RoomEditorTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const roomById = (id: string) => rooms.find((room) => room.id === id)
  const deletingRoom = deleteTarget ? roomById(deleteTarget) : undefined
  const resettingRoom = resetTarget ? roomById(resetTarget) : undefined

  const handleDuplicate = async (id: string) => {
    await duplicateRoom(roomStore, locusStore, questionStore, id)
    toast.success(t('rooms.toast.duplicated'))
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
            count={dueAcrossPalace.dueCount}
            breakdown={dueAcrossPalace.breakdown}
            onStudy={() => onStudyPalace?.()}
            onStudyAhead={onStudyPalace}
            scope="palace"
          />
        ) : null}

        {items.length > 0 ? (
          <PracticeModes
            bibleMode={palace.bibleMode}
            cardCount={summary.totalLoci}
            questionCount={summary.totalQuestions}
            onVerse={onVerse}
            onMatch={onMatch}
            onTest={onTest}
          />
        ) : null}

        <section aria-labelledby="rooms-heading">
          <h2
            id="rooms-heading"
            className="mb-3 px-0.5 text-[length:var(--p-text-title)] font-semibold text-heading"
          >
            {t('palaceDetail.roomsHeading')}
          </h2>

          {items.length === 0 ? (
            <EmptyState
              emoji="🚪"
              title={t('palaceDetail.emptyTitle')}
              description={t('palaceDetail.emptyBody')}
              action={
                <div className="flex flex-col items-center gap-2.5">
                  <Button onClick={() => setEditorTarget({ mode: 'add', palaceId })}>
                    <Plus className="size-[18px]" aria-hidden />
                    {t('palaceDetail.addFirstRoom')}
                  </Button>
                  <Button variant="ghost" onClick={() => setImportOpen(true)}>
                    <Upload className="size-[18px]" aria-hidden />
                    {t('importRooms.open')}
                  </Button>
                </div>
              }
            />
          ) : (
            <RoomList
              rooms={items}
              onOpen={(id) => onOpenRoom?.(id)}
              onEdit={(id) => {
                const room = roomById(id)
                if (room) setEditorTarget({ mode: 'edit', room })
              }}
              onMoveUp={(id) => void moveRoom(roomStore, id, 'up')}
              onMoveDown={(id) => void moveRoom(roomStore, id, 'down')}
              onDuplicate={(id) => void handleDuplicate(id)}
              onResetProgress={(id) => setResetTarget(id)}
              onDelete={(id) => setDeleteTarget(id)}
            />
          )}
        </section>
      </div>

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
    </AppScreen>
  )
}
