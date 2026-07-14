import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { resolveDeckSettings, shuffle, subtreeDeckIds } from '@/shared/lib'
import {
  DEFAULT_DECK_SETTINGS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { editDeck } from '@/features/deck'
import { QuizOptionsSheet, type QuizResult, QuizSession } from '@/widgets/quiz'
import { type QuizQuestion } from '@/features/quiz'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface QuizPageProps {
  deckId: string
  onBack?: () => void
}

export function QuizPage({ deckId, onBack }: QuizPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const questionStore = useQuestionStoreApi()
  const reward = useSessionReward()
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    deckStore.getState().start()
    questionStore.getState().start()
  }, [deckStore, questionStore])

  const decks = useDeckStore(selectDecks)
  const allQuestions = useQuestionStore(selectQuestions)
  const decksReady = useDeckStore(selectDecksReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = decksReady && questionsReady

  const deck = useMemo(() => decks.find((candidate) => candidate.id === deckId), [decks, deckId])
  const settings = useMemo(
    () => resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS),
    [decks, deckId],
  )

  const questions = useMemo<QuizQuestion[]>(() => {
    const nameById = new Map(decks.map((each) => [each.id, each.name]))
    const subtree = new Set(subtreeDeckIds(decks, deckId))
    const built = allQuestions.flatMap((question) =>
      subtree.has(question.deckId)
        ? [
            {
              id: question.id,
              prompt: question.prompt,
              options: question.options,
              correctAnswer: question.correctAnswer,
              deckName: nameById.get(question.deckId) ?? '',
              explanation: question.explanation,
            },
          ]
        : [],
    )
    return settings.shuffleQuestions ? shuffle(built) : built
  }, [allQuestions, decks, deckId, settings.shuffleQuestions])

  const frozenRef = useRef<QuizQuestion[] | null>(null)
  if (ready && frozenRef.current === null) frozenRef.current = questions
  const runQuestions = frozenRef.current ?? questions

  const setSetting = (changes: Partial<{ quizTimer: boolean; shuffleQuestions: boolean }>) => {
    if (deck) void editDeck(deckStore, deck.id, { settings: { ...deck.settings, ...changes } })
  }

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('quiz.notFound')} onBack={onBack} backLabel={t('quiz.back')} />
        }
      />
    )
  }

  const handleComplete = (result: QuizResult) => {
    void reward({
      kind: 'quiz',
      correct: result.score,
      total: result.total,
      accuracy: result.accuracy,
    })
    onBack?.()
  }

  return (
    <>
      <QuizSession
        key={deckId}
        questions={runQuestions}
        title={t('quiz.title', { deck: deck.name })}
        autoAdvance={settings.quizTimer}
        onOpenOptions={() => setOptionsOpen(true)}
        onBack={onBack ?? (() => {})}
        onComplete={handleComplete}
      />
      <QuizOptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        quizTimer={settings.quizTimer}
        shuffleQuestions={settings.shuffleQuestions}
        onQuizTimer={(value) => setSetting({ quizTimer: value })}
        onShuffleQuestions={(value) => setSetting({ shuffleQuestions: value })}
      />
    </>
  )
}
