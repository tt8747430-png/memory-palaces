import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'
import { resolveDeckSettings, shuffle, subtreeDeckIds } from '@/shared/domain'
import { type Deck, DEFAULT_DECK_SETTINGS, editDeck } from '@/decks'
import { useSessionReward } from '@/progress/ui'
import type { QuizQuestion } from '@/practice'
import type { QuizResult } from '@/practice/ui'

export interface QuizPageModel {
  ready: boolean
  deck: Deck | undefined
  title: string
  questions: QuizQuestion[]
  autoAdvance: boolean
  shuffleQuestions: boolean
  optionsOpen: boolean
  openOptions: () => void
  closeOptions: () => void
  setQuizTimer: (value: boolean) => void
  setShuffleQuestions: (value: boolean) => void
  complete: (result: QuizResult) => void
}

/**
 * The quiz page's ViewModel (ADR-0008 — earned, not automatic). It holds two rules the View
 * must not: the run is built from the deck's whole subtree and reshaped into `QuizQuestion`s,
 * and it is frozen the first time both stores are ready so a live RxDB emission cannot reorder
 * or resize a quiz already in progress. Shuffling therefore happens once, before the freeze.
 */
export function useQuizPage(deckId: string, onBack?: () => void): QuizPageModel {
  const { t } = useTranslation()
  const { deckStore, questionStore } = useServices()
  const reward = useSessionReward()
  const [optionsOpen, setOptionsOpen] = useState(false)

  const decks = useStore(deckStore.decks)
  const allQuestions = useStore(questionStore.questions)
  const decksReady = useStore(deckStore.status) === 'ready'
  const questionsReady = useStore(questionStore.status) === 'ready'
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

  // `main` freezes into a ref during render; `react-hooks/refs` rightly rejects that — a value
  // the render output depends on cannot live in a ref. React's documented equivalent is a
  // render-phase state latch: it re-renders immediately, before committing, and cannot loop
  // because `frozen` is only ever set while it is null.
  const [frozen, setFrozen] = useState<QuizQuestion[] | null>(null)
  if (ready && frozen === null) setFrozen(questions)

  const setSetting = useCallback(
    (changes: Partial<{ quizTimer: boolean; shuffleQuestions: boolean }>) => {
      if (deck) void editDeck(deckStore, deck.id, { settings: { ...deck.settings, ...changes } })
    },
    [deck, deckStore],
  )

  const openOptions = useCallback(() => setOptionsOpen(true), [])
  const closeOptions = useCallback(() => setOptionsOpen(false), [])
  const setQuizTimer = useCallback(
    (value: boolean) => setSetting({ quizTimer: value }),
    [setSetting],
  )
  const setShuffleQuestions = useCallback(
    (value: boolean) => setSetting({ shuffleQuestions: value }),
    [setSetting],
  )

  const complete = useCallback(
    (result: QuizResult) => {
      void reward({
        kind: 'quiz',
        correct: result.score,
        total: result.total,
        accuracy: result.accuracy,
      })
      onBack?.()
    },
    [reward, onBack],
  )

  return {
    ready,
    deck,
    title: t('quiz.title', { deck: deck?.name ?? '' }),
    questions: frozen ?? questions,
    autoAdvance: settings.quizTimer,
    shuffleQuestions: settings.shuffleQuestions,
    optionsOpen,
    openOptions,
    closeOptions,
    setQuizTimer,
    setShuffleQuestions,
    complete,
  }
}
