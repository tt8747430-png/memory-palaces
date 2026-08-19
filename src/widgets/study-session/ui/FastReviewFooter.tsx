import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { FastOutcome } from '@/entities/card'
import { cn } from '@/shared/lib'
import { SessionFooterShell } from './SessionFooterShell'

export interface FastReviewFooterProps {
  flipped: boolean
  notQuite: number
  gotIt: number
  onAnswer: (outcome: FastOutcome) => void
}

const TALLY = 'w-9 shrink-0 text-center text-(length:--p-text-sub) font-bold tabular-nums'

const ANSWER =
  'flex h-full flex-1 items-center justify-center rounded-control px-3 ' +
  'text-(length:--p-text-label) font-semibold transition-transform duration-150 ease-out ' +
  'active:scale-[0.96] focus-visible:outline-none'

/**
 * Fast review's answer bar. The two tallies stay put whether the card is turned over or not, so the
 * learner can see the session's shape at a glance; only the answers themselves wait for the back.
 */
export function FastReviewFooter({ flipped, notQuite, gotIt, onAnswer }: FastReviewFooterProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const crossfade = { duration: reduce ? 0 : 0.12 }

  return (
    <SessionFooterShell>
      <div className="flex h-14 items-center gap-2">
        <span className={cn(TALLY, 'text-(--warning-foreground)')}>{notQuite}</span>
        <div className="h-full min-w-0 flex-1">
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
              <motion.p
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossfade}
                className="flex h-full items-center justify-center text-(length:--p-text-label) text-muted-foreground"
              >
                {t('study.tapToReveal')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <span className={cn(TALLY, 'text-(--success-on-surface)')}>{gotIt}</span>
      </div>
    </SessionFooterShell>
  )
}
