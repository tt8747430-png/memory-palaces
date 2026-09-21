import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { FastOutcome } from '@/entities/card'
import { cn } from '@/shared/lib'
import { ReviewPrompt } from './ReviewPrompt'
import { StudySessionFooterShell } from './StudySessionFooterShell'

export interface FastReviewFooterProps {
  flipped: boolean
  notQuite: number
  gotIt: number
  onAnswer: (outcome: FastOutcome) => void
  onReveal: () => void
  onUndo: () => void
  canUndo: boolean
}

const TALLY =
  'inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-1 ' +
  'text-label font-bold tabular-nums shadow-rest'

const ANSWER =
  'flex h-full flex-1 items-center justify-center rounded-control px-3 ' +
  'text-label font-semibold shadow-rest transition-transform duration-150 ease-out ' +
  'active:scale-[0.96]'

export function FastReviewFooter({
  flipped,
  notQuite,
  gotIt,
  onAnswer,
  onReveal,
  onUndo,
  canUndo,
}: FastReviewFooterProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const crossfade = { duration: reduce ? 0 : 0.12 }

  const tallies = (
    <div className="flex items-center gap-1">
      <span className={cn(TALLY, 'bg-(--warning-surface) text-(--warning-foreground)')}>
        {notQuite}
        <span className="sr-only"> {t('fastReview.notQuite')}</span>
      </span>
      <span className={cn(TALLY, 'bg-(--success-surface) text-(--success-on-surface)')}>
        {gotIt}
        <span className="sr-only"> {t('fastReview.gotIt')}</span>
      </span>
    </div>
  )

  return (
    <StudySessionFooterShell>
      <div className="h-14">
        <AnimatePresence initial={false} mode="wait">
          {flipped ? (
            <motion.div
              key="answers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfade}
              className="flex h-full items-stretch gap-2"
            >
              <button
                type="button"
                onClick={() => onAnswer('notQuite')}
                className={cn(ANSWER, 'bg-(--warning-surface) text-(--warning-foreground)')}
              >
                {t('fastReview.notQuite')}
              </button>
              <button
                type="button"
                onClick={() => onAnswer('gotIt')}
                className={cn(ANSWER, 'bg-(--success-surface) text-(--success-on-surface)')}
              >
                {t('fastReview.gotIt')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfade}
              className="h-full"
            >
              <ReviewPrompt
                onReveal={onReveal}
                onUndo={onUndo}
                canUndo={canUndo}
                trailing={tallies}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudySessionFooterShell>
  )
}
