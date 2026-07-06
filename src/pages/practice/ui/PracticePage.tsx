import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  roomsForPalace,
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import {
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { PracticeModes, type PracticeStudyMode } from '@/widgets/practice-modes'
import { AppScreen, ScreenHeader } from '@/shared/ui'

/** Practice a single room's set, or a whole palace's set aggregated across its rooms. */
export type PracticeScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

export interface PracticePageProps {
  scope: PracticeScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
  /** Open the study session preset to an active-recall mode. */
  onPractice?: (mode: PracticeStudyMode) => void
  onMatch?: () => void
  onTest?: () => void
}

/** The Practice page — every way to exercise the scope's set beyond the flip Study session,
 * one full row per mode. Reached from the single Practice entry on the room hub and palace
 * detail; each study-mode row deep-links into the one study session. */
export function PracticePage({ scope, onBack, onPractice, onMatch, onTest }: PracticePageProps) {
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

  const allLoci = useLocusStore(selectLoci)
  const allRooms = useRoomStore(selectRooms)
  const allQuestions = useQuestionStore(selectQuestions)
  const palaces = usePalaceStore((state) => state.palaces)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && lociReady && questionsReady

  const room = useMemo(
    () =>
      scope.kind === 'room'
        ? allRooms.find((candidate) => candidate.id === scope.roomId)
        : undefined,
    [allRooms, scope],
  )
  const palace = useMemo(() => {
    const palaceId = scope.kind === 'palace' ? scope.palaceId : room?.palaceId
    return palaces.find((candidate) => candidate.id === palaceId)
  }, [palaces, scope, room])

  const scopeRoomIds = useMemo(
    () =>
      scope.kind === 'room'
        ? [scope.roomId]
        : roomsForPalace(allRooms, scope.palaceId).map((each) => each.id),
    [scope, allRooms],
  )
  const cardCount = useMemo(
    () => scopeRoomIds.reduce((sum, roomId) => sum + lociForRoom(allLoci, roomId).length, 0),
    [scopeRoomIds, allLoci],
  )
  const questionCount = useMemo(
    () =>
      scopeRoomIds.reduce((sum, roomId) => sum + questionsForRoom(allQuestions, roomId).length, 0),
    [scopeRoomIds, allQuestions],
  )

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const missing = scope.kind === 'room' ? !room : !palace
  if (missing) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('practice.notFound')}
            onBack={onBack}
            backLabel={t('roomHub.back')}
          />
        }
      />
    )
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('practice.title')}
          subtitle={scope.kind === 'room' ? room?.title : palace?.name}
          onBack={onBack}
          backLabel={t('roomHub.back')}
        />
      }
    >
      <div className="mt-2 pb-24">
        <PracticeModes
          cardCount={cardCount}
          questionCount={questionCount}
          onPractice={onPractice}
          onMatch={onMatch}
          onTest={onTest}
          alwaysEnableTest={scope.kind === 'room'}
        />
      </div>
    </AppScreen>
  )
}
