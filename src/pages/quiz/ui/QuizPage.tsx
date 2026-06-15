import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { shuffle } from '@/shared/lib'
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
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { QuizSession, type QuizResult } from '@/widgets/quiz'
import { type QuizQuestion } from '@/features/quiz'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface QuizPageProps {
  palaceId: string
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Palace quiz — tests recall over every authored question across the palace's
 * rooms. Questions optionally shuffle per the palace's settings. Result handling
 * (XP/accuracy history) lands with the progress entity in Phase 8. */
export function QuizPage({ palaceId, onBack }: QuizPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const questionStore = useQuestionStoreApi()

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    questionStore.getState().start()
  }, [palaceStore, roomStore, questionStore])

  const palace = usePalaceStore((state) => state.palaces.find((candidate) => candidate.id === palaceId))
  const allRooms = useRoomStore(selectRooms)
  const allQuestions = useQuestionStore(selectQuestions)
  // Each store hook runs unconditionally (Rules of Hooks); combine after.
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && questionsReady

  const shuffleQuestions = palace?.settings.shuffleQuestions ?? false
  const questions = useMemo<QuizQuestion[]>(() => {
    const rooms = roomsForPalace(allRooms, palaceId)
    const roomById = new Map(rooms.map((room) => [room.id, room]))
    const built = allQuestions.flatMap((question) => {
      const room = roomById.get(question.roomId)
      return room
        ? [
            {
              id: question.id,
              prompt: question.prompt,
              options: question.options,
              correctAnswer: question.correctAnswer,
              roomTitle: room.title,
              explanation: question.explanation,
            },
          ]
        : []
    })
    return shuffleQuestions ? shuffle(built) : built
  }, [allQuestions, allRooms, palaceId, shuffleQuestions])

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!palace) {
    return (
      <AppScreen>
        <ScreenHeader title={t('quiz.notFound')} onBack={onBack} backLabel={t('quiz.back')} />
      </AppScreen>
    )
  }

  const handleComplete = (_result: QuizResult) => {
    // Result persistence (XP / accuracy history) arrives with the progress entity in Phase 8.
    onBack?.()
  }

  return (
    <QuizSession
      key={palaceId}
      questions={questions}
      title={t('quiz.title', { palace: palace.name })}
      onBack={onBack ?? (() => {})}
      onComplete={handleComplete}
    />
  )
}
