import { useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Brain, Check, SkipForward, SlidersHorizontal } from 'lucide-react'
import { cn, SCREEN_SCROLL } from '@/shared/lib'
import { Button, Card, Chip, IconButton, SessionHeader, SessionScreen } from '@/shared/ui'
import { initQuiz, quizAccuracy, type QuizQuestion, quizReducer } from '@/features/quiz'
import type { QuizResult } from '../model/types'
import { QuizComplete } from './QuizComplete'
import { QuizEmpty } from './QuizEmpty'
import { QuizFeedback } from './QuizFeedback'
import { optionState } from '../model/option-state'
import { QuizOption } from './QuizOption'

export type { QuizResult }

export interface QuizSessionProps {
  questions: QuizQuestion[]
  title: string
  onBack: () => void
  onComplete: (result: QuizResult) => void
  autoAdvance?: boolean
  onOpenOptions?: () => void
}

const FEEDBACK_MS = 2200

export function QuizSession({
  questions,
  title,
  onBack,
  onComplete,
  autoAdvance = true,
  onOpenOptions,
}: QuizSessionProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(quizReducer, questions.length, initQuiz)

  const answered = state.status === 'answering' && state.answered
  const answeringIndex = state.status === 'answering' ? state.index : -1
  useEffect(() => {
    if (!answered || !autoAdvance) return
    const handle = window.setTimeout(() => dispatch({ type: 'next' }), FEEDBACK_MS)
    return () => window.clearTimeout(handle)
  }, [answered, autoAdvance, answeringIndex])

  const done = state.status === 'complete'
  useEffect(() => {
    if (!done) return
    const handle = window.setTimeout(
      () =>
        onComplete({
          score: state.score,
          total: state.total,
          accuracy: quizAccuracy(state.score, state.total),
        }),
      FEEDBACK_MS,
    )
    return () => window.clearTimeout(handle)
    // The finish edge fires once. Depending on the score it reads would restart the delay on the
    // last answer's own state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  if (questions.length === 0) return <QuizEmpty onBack={onBack} />

  const question = state.status === 'answering' ? questions[state.index] : undefined
  const answering = question !== undefined && state.status === 'answering'
  const result: QuizResult = done
    ? { score: state.score, total: state.total, accuracy: quizAccuracy(state.score, state.total) }
    : { score: 0, total: questions.length, accuracy: 0 }

  const submit = () => {
    if (state.status !== 'answering' || state.selected === null || !question) return
    dispatch({ type: 'submit', correct: state.selected === question.correctAnswer })
  }

  const reached = (state.status === 'answering' ? state.index : state.total) + (done ? 0 : 1)

  return (
    <SessionScreen>
      <SessionHeader
        title={title}
        backLabel={t('quiz.goBack')}
        onBack={onBack}
        action={
          <div className="flex items-center gap-2">
            {onOpenOptions ? (
              <IconButton
                variant="glass"
                aria-label={t('quiz.options.title')}
                onClick={onOpenOptions}
              >
                <SlidersHorizontal className="size-5" aria-hidden />
              </IconButton>
            ) : null}
            <IconButton
              variant="glass"
              aria-label={t('quiz.skip')}
              disabled={!question}
              onClick={() => dispatch({ type: 'skip' })}
            >
              <SkipForward className="size-5" aria-hidden />
            </IconButton>
          </div>
        }
      >
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/30">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-primary to-accent"
              animate={{ width: `${(reached / state.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="shrink-0 text-(length:--p-text-label) font-semibold tabular-nums text-heading">
            {t('quiz.questionCount', {
              current: state.status === 'answering' ? state.index + 1 : state.total,
              total: state.total,
            })}
          </span>
        </div>
      </SessionHeader>

      {answering ? (
        <div className={cn(SCREEN_SCROLL, 'flex-1 space-y-4 px-5 py-5')}>
          <motion.div
            key={state.index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-control bg-info-surface">
                  <Brain className="size-5 text-heading" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <Chip className="mb-2">{question.deckName}</Chip>
                  <h2 className="text-(length:--p-text-sub) font-medium leading-relaxed text-heading">
                    {question.prompt}
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <QuizOption
                    key={index}
                    letter={String.fromCharCode(65 + index)}
                    option={option}
                    state={optionState(
                      index,
                      state.selected,
                      state.answered,
                      question.correctAnswer,
                    )}
                    disabled={state.answered}
                    onClick={() => dispatch({ type: 'select', option: index })}
                  />
                ))}
              </div>
            </Card>
          </motion.div>

          <AnimatePresence>
            {state.answered ? (
              <QuizFeedback
                correct={state.selected === question.correctAnswer}
                explanation={question.explanation}
                streak={state.streak}
              />
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {answering ? (
        <div className="px-5 pb-7 pt-2">
          {state.answered ? (
            <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'next' })}>
              <Check className="size-5" aria-hidden />
              {state.index >= state.total - 1 ? t('quiz.seeResults') : t('quiz.continue')}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              disabled={state.selected === null}
              onClick={submit}
            >
              {state.selected === null ? t('quiz.selectAnswer') : t('quiz.submit')}
            </Button>
          )}
        </div>
      ) : null}

      <AnimatePresence>
        {done ? (
          <QuizComplete
            result={result}
            onRetry={() => dispatch({ type: 'restart' })}
            onDone={() => onComplete(result)}
          />
        ) : null}
      </AnimatePresence>
    </SessionScreen>
  )
}
