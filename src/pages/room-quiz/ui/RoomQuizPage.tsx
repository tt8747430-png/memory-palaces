import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shuffle } from '@/shared/lib'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { selectIsReady as selectRoomsReady, useRoomStore, useRoomStoreApi } from '@/entities/room'
import {
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { editPalace } from '@/features/palace'
import { QuizOptionsSheet, QuizSession, type QuizResult } from '@/widgets/quiz'
import { type QuizQuestion } from '@/features/quiz'
import { quizXp } from '@/features/progress'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface RoomQuizPageProps {
  roomId: string
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Room quiz (Test mode) — tests recall over just this room's authored questions,
 * reusing the palace-quiz session machinery scoped to one room. Shuffle follows the
 * owning palace's setting; a passing run (≥80%) counts as a training day. */
export function RoomQuizPage({ roomId, onBack }: RoomQuizPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const questionStore = useQuestionStoreApi()
  const reward = useSessionReward()
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    questionStore.getState().start()
  }, [palaceStore, roomStore, questionStore])

  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === roomId))
  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === room?.palaceId),
  )
  const allQuestions = useQuestionStore(selectQuestions)
  // Each store hook runs unconditionally (Rules of Hooks); combine readiness after.
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && questionsReady

  const shuffleQuestions = palace?.settings.shuffleQuestions ?? false
  const roomTitle = room?.title
  const questions = useMemo<QuizQuestion[]>(() => {
    if (!roomTitle) return []
    const built = questionsForRoom(allQuestions, roomId).map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      correctAnswer: question.correctAnswer,
      roomTitle,
      explanation: question.explanation,
    }))
    return shuffleQuestions ? shuffle(built) : built
  }, [allQuestions, roomId, roomTitle, shuffleQuestions])

  // Freeze the question set for the active run so toggling shuffle re-orders the next quiz.
  const frozenRef = useRef<QuizQuestion[] | null>(null)
  if (ready && frozenRef.current === null) frozenRef.current = questions
  const runQuestions = frozenRef.current ?? questions

  const setSetting = (changes: Partial<{ quizTimer: boolean; shuffleQuestions: boolean }>) => {
    if (palace)
      void editPalace(palaceStore, palace.id, { settings: { ...palace.settings, ...changes } })
  }

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
          <ScreenHeader title={t('quiz.notFound')} onBack={onBack} backLabel={t('quiz.back')} />
        }
      />
    )
  }

  const handleComplete = (result: QuizResult) => {
    // Every answered question counts toward the daily goal; XP scales with correct answers.
    void reward({
      xp: quizXp(result.score),
      quizAccuracy: result.accuracy,
      itemsPracticed: result.total,
    })
    onBack?.()
  }

  return (
    <>
      <QuizSession
        key={roomId}
        questions={runQuestions}
        title={t('quiz.roomTitle', { room: room.title })}
        autoAdvance={palace?.settings.quizTimer ?? true}
        onOpenOptions={palace ? () => setOptionsOpen(true) : undefined}
        onBack={onBack ?? (() => {})}
        onComplete={handleComplete}
      />
      {palace ? (
        <QuizOptionsSheet
          open={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          quizTimer={palace.settings.quizTimer}
          shuffleQuestions={palace.settings.shuffleQuestions}
          onQuizTimer={(value) => setSetting({ quizTimer: value })}
          onShuffleQuestions={(value) => setSetting({ shuffleQuestions: value })}
        />
      ) : null}
    </>
  )
}
