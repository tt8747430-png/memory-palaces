import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { FastOutcome } from '@/entities/card'
import type { Buckets, StudySessionMode } from '@/features/review'
import type { SrsState, SrsStatus } from '@/shared/lib'
import { cn, srsStatus } from '@/shared/lib'
import { GradeButtons } from '@/shared/ui'
import type { Grade } from '@/shared/lib'
import { FastReviewFooter } from './FastReviewFooter'
import { ReviewPrompt } from './ReviewPrompt'
import { StudySessionFooterShell } from './StudySessionFooterShell'

export type RemainingTally = Record<SrsStatus, number>

export interface StudySessionFooterProps {
  flipped: boolean
  mode: StudySessionMode
  srs: SrsState | undefined
  now: number
  remaining: RemainingTally
  buckets: Buckets
  onGrade: (grade: Grade) => void
  onAnswer: (outcome: FastOutcome) => void
  /** Shows the answer — the same thing tapping the card does. */
  onReveal: () => void
  onUndo: () => void
  canUndo: boolean
}

export function StudySessionFooter({
  flipped,
  mode,
  srs,
  now,
  remaining,
  buckets,
  onGrade,
  onAnswer,
  onReveal,
  onUndo,
  canUndo,
}: StudySessionFooterProps) {
  const reduce = useReducedMotion()
  const crossfade = { duration: reduce ? 0 : 0.12 }

  if (mode === 'fast') {
    return (
      <FastReviewFooter
        flipped={flipped}
        notQuite={buckets.notQuite.length}
        gotIt={buckets.gotIt.length}
        onAnswer={onAnswer}
        onReveal={onReveal}
        onUndo={onUndo}
        canUndo={canUndo}
      />
    )
  }

  return (
    <StudySessionFooterShell>
      <div className="h-14">
        <AnimatePresence initial={false} mode="wait">
          {flipped ? (
            <motion.div
              key="grade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfade}
              className="h-full"
            >
              <GradeButtons className="h-full" srs={srs} now={now} onGrade={onGrade} />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
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
                trailing={<RemainingCounts remaining={remaining} current={srsStatus(srs)} />}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudySessionFooterShell>
  )
}

const COUNT_CHIP: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-(--success-surface) text-(--success-on-surface)',
}

const ORDER = ['new', 'learning', 'known'] as const

/**
 * What is left, by card status — numbers only, so the row still holds a button beside them. Each
 * carries its name for a screen reader, which is the one place the word is worth its width.
 */
function RemainingCounts({
  remaining,
  current,
}: {
  remaining: RemainingTally
  current?: SrsStatus
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1">
      {ORDER.map((key) => (
        <span
          key={key}
          className={cn(
            'inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-1 text-label font-bold tabular-nums shadow-rest',
            COUNT_CHIP[key],
            current === key && 'ring-2 ring-(--ring)/30',
          )}
        >
          {remaining[key]}
          <span className="sr-only"> {t(`srs.${key}` as never)}</span>
        </span>
      ))}
    </div>
  )
}
