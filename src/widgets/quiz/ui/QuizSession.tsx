import { useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Brain, Check, CheckCircle2, Flame, RotateCcw, SkipForward, X, XCircle, Zap } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, Card, Chip, IconButton } from '@/shared/ui'
import { initQuiz, quizAccuracy, quizReducer, type QuizQuestion } from '@/features/quiz'

export interface QuizResult {
  score: number
  total: number
  accuracy: number
}

export interface QuizSessionProps {
  questions: QuizQuestion[]
  title: string
  onBack: () => void
  onComplete: (result: QuizResult) => void
}

/** Auto-advance delay after the answer is revealed; a Continue tap skips the wait. */
const FEEDBACK_MS = 2200

/** Multiple-choice quiz session: one question at a time, select → submit → reveal →
 * continue, driven by the pure `quizReducer`. The widget owns the questions and tells
 * the machine only whether each choice was correct. */
export function QuizSession({ questions, title, onBack, onComplete }: QuizSessionProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(quizReducer, questions.length, initQuiz)

  // After the reveal, drift to the next question; a Continue tap pre-empts the timer.
  const answered = state.status === 'answering' && state.answered
  useEffect(() => {
    if (!answered) return
    const handle = window.setTimeout(() => dispatch({ type: 'next' }), FEEDBACK_MS)
    return () => window.clearTimeout(handle)
  }, [answered, state.status === 'answering' ? state.index : -1])

  // Hand back the result once the run completes.
  const done = state.status === 'complete'
  useEffect(() => {
    if (!done) return
    const handle = window.setTimeout(
      () => onComplete({ score: state.score, total: state.total, accuracy: quizAccuracy(state.score, state.total) }),
      FEEDBACK_MS,
    )
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  if (questions.length === 0) {
    return (
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
          <Brain className="size-8 text-accent" aria-hidden />
        </div>
        <div>
          <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('quiz.empty')}
          </h2>
          <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">{t('quiz.emptyHint')}</p>
        </div>
        <Button onClick={onBack}>{t('quiz.back')}</Button>
      </div>
    )
  }

  const question = state.status === 'answering' ? questions[state.index] : undefined
  const result: QuizResult = done
    ? { score: state.score, total: state.total, accuracy: quizAccuracy(state.score, state.total) }
    : { score: 0, total: questions.length, accuracy: 0 }

  const submit = () => {
    if (state.status !== 'answering' || state.selected === null || !question) return
    dispatch({ type: 'submit', correct: state.selected === question.correctAnswer })
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
      <div className="px-5 pt-safe">
        <div className="flex items-center justify-between gap-2 pt-3">
          <IconButton variant="glass" aria-label={t('quiz.goBack')} onClick={onBack}>
            <X className="size-5" aria-hidden />
          </IconButton>
          <h1 className="min-w-0 flex-1 truncate text-center text-[length:var(--p-text-title)] font-semibold text-heading">
            {title}
          </h1>
          <IconButton
            variant="glass"
            aria-label={t('quiz.skip')}
            disabled={!question}
            onClick={() => dispatch({ type: 'skip' })}
          >
            <SkipForward className="size-5" aria-hidden />
          </IconButton>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              animate={{
                width: `${(((state.status === 'answering' ? state.index : state.total) + (done ? 0 : 1)) / state.total) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="shrink-0 text-[length:var(--p-text-label)] font-semibold tabular-nums text-heading">
            {t('quiz.questionCount', {
              current: state.status === 'answering' ? state.index + 1 : state.total,
              total: state.total,
            })}
          </span>
        </div>
      </div>

      {question && state.status === 'answering' ? (
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 scrollbar-hide">
          <motion.div key={state.index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-control bg-info-surface">
                  <Brain className="size-5 text-heading" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <Chip className="mb-2">{question.roomTitle}</Chip>
                  <h2 className="text-[length:var(--p-text-sub)] font-medium leading-relaxed text-heading">
                    {question.prompt}
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <OptionButton
                    key={index}
                    letter={String.fromCharCode(65 + index)}
                    option={option}
                    state={optionState(index, state.selected, state.answered, question.correctAnswer)}
                    disabled={state.answered}
                    onClick={() => dispatch({ type: 'select', option: index })}
                  />
                ))}
              </div>
            </Card>
          </motion.div>

          <AnimatePresence>
            {state.answered ? (
              <Feedback
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

      {question && state.status === 'answering' ? (
        <div className="px-5 pb-7 pt-2">
          {state.answered ? (
            <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'next' })}>
              <Check className="size-5" aria-hidden />
              {state.index >= state.total - 1 ? t('quiz.seeResults') : t('quiz.continue')}
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={state.selected === null} onClick={submit}>
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
    </div>
  )
}

type OptionDisplay = 'idle' | 'selected' | 'correct' | 'wrong'

function optionState(
  index: number,
  selected: number | null,
  answered: boolean,
  correctAnswer: number,
): OptionDisplay {
  if (answered) {
    if (index === correctAnswer) return 'correct'
    if (index === selected) return 'wrong'
    return 'idle'
  }
  return index === selected ? 'selected' : 'idle'
}

function OptionButton({
  letter,
  option,
  state,
  disabled,
  onClick,
}: {
  letter: string
  option: string
  state: OptionDisplay
  disabled: boolean
  onClick: () => void
}) {
  const tone: Record<OptionDisplay, string> = {
    idle: 'border-border bg-card text-heading',
    selected: 'border-secondary bg-info-surface text-heading',
    correct: 'border-[var(--success)] bg-[var(--success-surface)] text-[var(--success-on-surface)]',
    wrong: 'border-[var(--danger)] bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between rounded-control border-2 p-4 text-left transition-transform active:scale-[0.99]',
        tone[state],
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-control bg-card text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
          {letter}
        </span>
        <span className="font-medium">{option}</span>
      </span>
      {state === 'correct' ? <CheckCircle2 className="size-5" aria-hidden /> : null}
      {state === 'wrong' ? <XCircle className="size-5" aria-hidden /> : null}
    </button>
  )
}

function Feedback({
  correct,
  explanation,
  streak,
}: {
  correct: boolean
  explanation?: string
  streak: number
}) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'rounded-card border p-4',
        correct
          ? 'border-[var(--success)]/30 bg-[var(--success-surface)]'
          : 'border-[var(--danger)]/30 bg-[var(--danger-surface)]',
      )}
    >
      <div className="flex items-start gap-2.5">
        {correct ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--success-on-surface)]" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-[var(--danger-on-surface)]" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'font-semibold',
                correct ? 'text-[var(--success-on-surface)]' : 'text-[var(--danger-on-surface)]',
              )}
            >
              {correct ? t('quiz.correct') : t('quiz.notQuite')}
            </p>
            {correct && streak >= 2 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-surface)] px-2 py-0.5 text-[length:var(--p-text-label)] font-semibold text-[var(--warning-foreground)]">
                <Flame className="size-3" aria-hidden />
                {t('quiz.streakOther', { count: streak })}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              'mt-1 text-[length:var(--p-text-label)]',
              correct ? 'text-[var(--success-on-surface)]' : 'text-[var(--danger-on-surface)]',
            )}
          >
            {explanation ?? (correct ? t('quiz.wellRecalled') : t('quiz.reviewHint'))}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function QuizComplete({
  result,
  onRetry,
  onDone,
}: {
  result: QuizResult
  onRetry: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const passed = result.accuracy >= 80
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-card-glass px-6 text-center"
    >
      <div
        className={cn(
          'mb-3 grid size-24 place-items-center rounded-full',
          passed ? 'bg-[var(--success-surface)]' : 'bg-info-surface',
        )}
      >
        <Zap
          className={cn('size-12', passed ? 'text-[var(--success-on-surface)]' : 'text-accent')}
          aria-hidden
        />
      </div>
      <h2 className="text-[length:var(--p-text-headline)] font-bold text-heading">{t('quiz.complete')}</h2>
      <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
        {t('quiz.scoreLine', { score: result.score, total: result.total })}
      </p>
      <p className="text-[length:var(--p-text-body)] text-muted-foreground">
        {t('quiz.accuracy', { accuracy: result.accuracy })}
      </p>
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw className="size-5" aria-hidden />
          {t('quiz.retry')}
        </Button>
        <Button onClick={onDone}>{t('quiz.done')}</Button>
      </div>
    </motion.div>
  )
}
