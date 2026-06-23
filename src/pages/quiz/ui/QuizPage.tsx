import { useEffect, useMemo, useRef, useState } from 'react'
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
import { editPalace } from '@/features/palace'
import { QuizOptionsSheet, QuizSession, type QuizResult } from '@/widgets/quiz'
import { type QuizQuestion } from '@/features/quiz'
import { quizXp } from '@/features/progress'
import { useSessionReward } from '@/widgets/session-reward'
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
  const reward = useSessionReward()
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    questionStore.getState().start()
  }, [palaceStore, roomStore, questionStore])

  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
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

  // Freeze the question set for the active run so toggling shuffle from the options sheet
  // re-orders the next quiz, not the one in progress.
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

  if (!palace) {
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
        key={palaceId}
        questions={runQuestions}
        title={t('quiz.title', { palace: palace.name })}
        autoAdvance={palace.settings.quizTimer}
        onOpenOptions={() => setOptionsOpen(true)}
        onBack={onBack ?? (() => {})}
        onComplete={handleComplete}
      />
      <QuizOptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        quizTimer={palace.settings.quizTimer}
        shuffleQuestions={palace.settings.shuffleQuestions}
        onQuizTimer={(value) => setSetting({ quizTimer: value })}
        onShuffleQuestions={(value) => setSetting({ shuffleQuestions: value })}
      />
    </>
  )
}
