import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  BookOpen,
  Brain,
  ChevronRight,
  GraduationCap,
  Puzzle,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import {
  selectIsReady as selectRoomsReady,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  lociForRoom,
  type Locus,
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
import { markRoomKnown, resetRoomSrs } from '@/features/locus'
import { deleteRoom } from '@/features/room'
import { cardMaturityCounts, cn, isDue } from '@/shared/lib'
import { LociPreviewCarousel } from '@/widgets/loci-preview'
import { RoomContentEditor } from '@/widgets/loci-editor'
import {
  AppScreen,
  CardMaturityOverview,
  ConfirmDialog,
  OverflowMenuButton,
  ScreenHeader,
  StudyOverviewCard,
  type SheetAction,
} from '@/shared/ui'

export interface RoomHubPageProps {
  roomId: string
  onBack?: () => void
  /** Launch the whole-room study session (room-train); used as "Study ahead". */
  onStudy?: () => void
  /** Drill this room's due-today queue (room-scoped review). */
  onStudyDue?: () => void
  /** Launch the Match mini-game. */
  onMatch?: () => void
  /** Launch the room-scoped quiz (Test). */
  onTest?: () => void
  /** Launch verse-study (Bible-mode palaces only). */
  onVerse?: () => void
  /** Navigate away after the room is deleted. */
  onDeleted?: () => void
}

/** The room hub — one screen per room: a pinned header + progress hero, then the card
 * preview and practice modes, then the room's cards-and-questions editor inline below
 * (one scroll, study on top, manage beneath). */
export function RoomHubPage({
  roomId,
  onBack,
  onStudy,
  onStudyDue,
  onMatch,
  onTest,
  onVerse,
  onDeleted,
}: RoomHubPageProps) {
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

  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === roomId))
  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === room?.palaceId),
  )
  const allLoci = useLocusStore(selectLoci)
  const allQuestions = useQuestionStore(selectQuestions)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && lociReady && questionsReady

  const loci = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [now] = useState(() => Date.now())
  const dueLoci = useMemo(() => loci.filter((locus) => isDue(locus.srs, now)), [loci, now])
  const dueBreakdown = useMemo(() => cardMaturityCounts(dueLoci), [dueLoci])
  const maturity = useMemo(() => cardMaturityCounts(loci), [loci])

  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!room) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('roomHub.notFound')}
            onBack={onBack}
            backLabel={t('roomHub.back')}
          />
        }
      />
    )
  }

  const hasLoci = loci.length > 0
  const menuActions: SheetAction[] = [
    {
      id: 'mark-known',
      label: t('roomHub.menu.markKnown'),
      icon: <GraduationCap className="size-5" aria-hidden />,
      disabled: !hasLoci,
      onSelect: () => {
        void markRoomKnown(locusStore, roomId)
        toast.success(t('roomHub.toast.markedKnown'))
      },
    },
    {
      id: 'reset',
      label: t('roomHub.menu.reset'),
      icon: <RotateCcw className="size-5" aria-hidden />,
      disabled: !hasLoci,
      onSelect: () => setResetOpen(true),
    },
    {
      id: 'delete',
      label: t('roomHub.menu.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => setDeleteOpen(true),
    },
  ]

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={room.title}
          subtitle={palace?.name}
          onBack={onBack}
          backLabel={t('roomHub.back')}
          action={
            <OverflowMenuButton
              label={t('roomHub.menu.label')}
              title={room.title}
              actions={menuActions}
              cancelLabel={t('common.cancel')}
            />
          }
        />
      }
    >
      <div className="mt-2 space-y-5 pb-24">
        {hasLoci ? (
          <StudyOverviewCard
            count={dueLoci.length}
            breakdown={dueBreakdown}
            onStudy={() => onStudyDue?.()}
            onStudyAhead={onStudy}
            scope="room"
          />
        ) : null}

        <StudyView
          loci={loci}
          questionCount={questions.length}
          speakable={palace?.settings.textToSpeech ?? false}
          direction={palace?.settings.studyDirection ?? 'front'}
          bibleMode={palace?.bibleMode ?? false}
          onStudy={onStudy}
          onMatch={onMatch}
          onTest={onTest}
          onVerse={onVerse}
        />

        <section aria-label={t('roomHub.manageHeading')} className="space-y-3">
          <h2 className="text-[length:var(--p-text-title)] font-semibold text-heading">
            {t('roomHub.manageHeading')}
          </h2>
          {hasLoci ? (
            <CardMaturityOverview total={loci.length} counts={maturity} scope="room" />
          ) : null}
          <RoomContentEditor
            roomId={roomId}
            roomName={room.title}
            bibleMode={palace?.bibleMode ?? false}
          />
        </section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('roomHub.resetConfirm.title')}
        description={t('roomHub.resetConfirm.body')}
        confirmLabel={t('roomHub.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void resetRoomSrs(locusStore, roomId)
          toast.success(t('roomHub.toast.reset'))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('roomHub.deleteConfirm.title', { title: room.title })}
        description={t('roomHub.deleteConfirm.body')}
        confirmLabel={t('roomHub.deleteConfirm.confirm')}
        cancelLabel={t('roomHub.deleteConfirm.cancel')}
        onConfirm={() => {
          void deleteRoom(roomStore, roomId)
          toast.success(t('roomHub.toast.deleted'))
          onDeleted?.()
        }}
      />
    </AppScreen>
  )
}

function StudyView({
  loci,
  questionCount,
  speakable,
  direction,
  bibleMode,
  onStudy,
  onMatch,
  onTest,
  onVerse,
}: {
  loci: Locus[]
  questionCount: number
  speakable: boolean
  direction: 'front' | 'back'
  bibleMode: boolean
  onStudy?: () => void
  onMatch?: () => void
  onTest?: () => void
  onVerse?: () => void
}) {
  const { t } = useTranslation()
  const hasLoci = loci.length > 0

  return (
    <div className="space-y-5">
      {hasLoci ? (
        <LociPreviewCarousel
          loci={loci}
          direction={direction}
          speakable={speakable}
          onOpen={onStudy}
          openLabel={t('roomHub.modes.flashcards')}
        />
      ) : null}

      <div className="space-y-2.5">
        {bibleMode && onVerse ? (
          <ModeTile
            icon={<BookOpen className="size-5" aria-hidden />}
            tint="bg-gradient-to-br from-primary to-accent"
            label={t('roomHub.modes.verses')}
            sublabel={t('roomHub.modes.versesSub')}
            onClick={onVerse}
            disabled={!hasLoci}
          />
        ) : null}
        <ModeTile
          icon={<Puzzle className="size-5" aria-hidden />}
          tint="bg-accent"
          label={t('roomHub.modes.match')}
          sublabel={t('roomHub.modes.matchSub')}
          onClick={onMatch}
          disabled={loci.length < 2}
        />
        <ModeTile
          icon={<Brain className="size-5" aria-hidden />}
          tint="bg-primary"
          label={t('roomHub.modes.test')}
          sublabel={
            questionCount > 0
              ? t(
                  questionCount === 1
                    ? 'roomHub.modes.testSubOne'
                    : 'roomHub.modes.testSubOther',
                  { count: questionCount },
                )
              : t('roomHub.modes.testEmpty')
          }
          onClick={onTest}
          disabled={questionCount === 0}
        />
      </div>
    </div>
  )
}

function ModeTile({
  icon,
  tint,
  label,
  sublabel,
  onClick,
  disabled,
}: {
  icon: ReactNode
  tint: string
  label: string
  sublabel: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-3.5 text-left shadow-rest',
        'transition-opacity disabled:opacity-45',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-control text-primary-foreground',
          tint,
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
          {label}
        </span>
        <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
          {sublabel}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </motion.button>
  )
}
