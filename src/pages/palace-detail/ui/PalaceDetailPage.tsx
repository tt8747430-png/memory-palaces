import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ChevronRight, Pencil, Plus, RotateCcw, Settings2, Trash2, Upload } from 'lucide-react'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
  type Palace,
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
import { deleteRoom, duplicateRoom, moveRoom, RoomEditorSheet, type RoomEditorTarget } from '@/features/room'
import { resetRoomSrs } from '@/features/locus'
import { ImportRoomsSheet } from '@/features/content'
import { isLocusReviewed, isRoomCompleted, palaceProgress, roomProgress, srsStatus } from '@/shared/lib'
import { RoomList, type RoomListItem } from '@/widgets/room-list'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyState,
  GlassCard,
  IconButton,
  PalaceCover,
  ScreenHeader,
} from '@/shared/ui'

export interface PalaceDetailPageProps {
  palaceId: string
  /** Provided by the route wrapper (kept out of the component so it stays router-free). */
  onBack?: () => void
  /** Open a room's hub; wired by the route wrapper. */
  onOpenRoom?: (roomId: string) => void
  /** Open this palace's settings; wired by the route wrapper. */
  onOpenSettings?: () => void
}

/** Palace detail — the palace's overview (identity, derived progress, palace quiz) above
 * its ordered rooms, the place to create, edit, reorder, and delete them. Room-level
 * study lives in the room hub; opening a room leaves this screen. Reactive off RxDB;
 * every action persists offline through the injected stores. */
export function PalaceDetailPage({
  palaceId,
  onBack,
  onOpenRoom,
  onOpenSettings,
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

  const palace = usePalaceStore((state) => state.palaces.find((candidate) => candidate.id === palaceId))
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
        const status = srsStatus(locus.srs, now)
        if (status === 'known') known += 1
        if (status === 'due') due += 1
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
    const completions = items.map((item) => item.completed)
    return {
      totalRooms: items.length,
      roomsCompleted: completions.filter(Boolean).length,
      totalLoci: items.reduce((sum, item) => sum + item.lociCount, 0),
      totalQuestions: items.reduce((sum, item) => sum + item.questionCount, 0),
      totalKnown: items.reduce((sum, item) => sum + item.knownCount, 0),
      progress: palaceProgress(completions),
    }
  }, [items])

  const nextRoom = useMemo(() => items.find((item) => !item.completed) ?? items[0], [items])

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
        header={<ScreenHeader title={t('palaceDetail.notFound')} onBack={onBack} backLabel={t('palaceDetail.back')} />}
      />
    )
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={palace.name}
          subtitle={t(summary.totalRooms === 1 ? 'palaceDetail.roomSummaryOne' : 'palaceDetail.roomSummaryOther', {
            count: summary.totalRooms,
          })}
          onBack={onBack}
          backLabel={t('palaceDetail.back')}
          action={
            onOpenSettings ? (
              <IconButton variant="glass" aria-label={t('palaceDetail.settingsLabel')} onClick={onOpenSettings}>
                <Settings2 className="size-5" aria-hidden />
              </IconButton>
            ) : undefined
          }
        />
      }
    >
      <div className="mt-4 space-y-5 pb-10">
        <PalaceHero
          palace={palace}
          summary={summary}
          nextRoom={nextRoom}
          onEditIdentity={onOpenSettings}
          onContinue={nextRoom ? () => onOpenRoom?.(nextRoom.id) : undefined}
        />

        <section aria-labelledby="rooms-heading">
          <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
            <h2 id="rooms-heading" className="text-[length:var(--p-text-title)] font-semibold text-heading">
              {t('palaceDetail.roomsHeading')}
            </h2>
            <div className="flex items-center gap-1.5">
              <IconButton
                variant="ghost"
                aria-label={t('importRooms.open')}
                onClick={() => setImportOpen(true)}
              >
                <Upload className="size-5" aria-hidden />
              </IconButton>
              <Button size="sm" variant="secondary" onClick={() => setEditorTarget({ mode: 'add', palaceId })}>
                <Plus className="size-[18px]" aria-hidden />
                {t('palaceDetail.addRoom')}
              </Button>
            </div>
          </div>

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
          toast.success(editorTarget?.mode === 'edit' ? t('rooms.toast.updated') : t('rooms.toast.added', { title: room.title }))
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
    </AppScreen>
  )
}

interface PalaceSummary {
  totalRooms: number
  roomsCompleted: number
  totalLoci: number
  totalQuestions: number
  totalKnown: number
  progress: number
}

function PalaceHero({
  palace,
  summary,
  nextRoom,
  onEditIdentity,
  onContinue,
}: {
  palace: Palace
  summary: PalaceSummary
  nextRoom: RoomListItem | undefined
  onEditIdentity?: () => void
  onContinue?: () => void
}) {
  const { t } = useTranslation()
  const stats = [
    { key: 'rooms', value: `${summary.roomsCompleted}/${summary.totalRooms}`, label: t('palaceDetail.stats.rooms') },
    { key: 'cards', value: String(summary.totalLoci), label: t('palaceDetail.stats.cards') },
    { key: 'questions', value: String(summary.totalQuestions), label: t('palaceDetail.stats.questions') },
    { key: 'mastered', value: String(summary.totalKnown), label: t('palaceDetail.stats.mastered') },
  ]

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-start gap-3.5">
        <CoverButton palace={palace} onEditIdentity={onEditIdentity} />
        <div className="min-w-0 flex-1">
          {palace.description ? (
            <p className="line-clamp-3 text-[length:var(--p-text-body)] text-secondary">{palace.description}</p>
          ) : (
            <p className="text-[length:var(--p-text-body)] text-muted-foreground">
              {t('palaceDetail.noDescription')}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('palaceDetail.overallProgress')}
          </span>
          <span className="text-[length:var(--p-text-sub)] font-bold tabular-nums text-heading">
            {summary.progress}%
          </span>
        </div>
        <span className="block h-2.5 overflow-hidden rounded-full bg-secondary/40">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${summary.progress}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="block h-full rounded-full bg-linear-to-r from-primary to-accent"
          />
        </span>
      </div>

      <dl className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-control bg-info-surface px-2 py-2.5 text-center">
            <dd className="text-[length:var(--p-text-sub)] font-bold leading-none tabular-nums text-heading">
              {stat.value}
            </dd>
            <dt className="mt-1 text-[length:var(--p-text-tiny)] font-medium text-secondary">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>

      {nextRoom && onContinue ? (
        <Button className="w-full" onClick={onContinue}>
          {t(nextRoom.completed ? 'palaceDetail.review' : 'palaceDetail.continue', { title: nextRoom.title })}
          <ChevronRight className="size-[18px]" aria-hidden />
        </Button>
      ) : null}
    </GlassCard>
  )
}

function CoverButton({ palace, onEditIdentity }: { palace: Palace; onEditIdentity?: () => void }) {
  const { t } = useTranslation()
  const cover = (
    <PalaceCover
      icon={palace.icon}
      color={palace.color}
      image={palace.image}
      className="size-16 rounded-card shadow-rest"
      iconClassName="text-3xl"
    />
  )
  if (!onEditIdentity) {
    return <div className="shrink-0">{cover}</div>
  }
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onEditIdentity}
      aria-label={t('palaceDetail.editIdentity')}
      className="relative shrink-0 rounded-card"
    >
      {cover}
      <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-rest ring-2 ring-card">
        <Pencil className="size-3" aria-hidden />
      </span>
    </motion.button>
  )
}
