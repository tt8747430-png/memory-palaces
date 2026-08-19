import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { FastOutcome } from '@/entities/card'
import type { Buckets, SessionMode } from '@/features/review'
import type { SrsState, SrsStatus } from '@/shared/lib'
import { cn, srsStatus } from '@/shared/lib'
import { GradeButtons } from '@/shared/ui'
import type { Grade } from '@/shared/lib'
import { FastReviewFooter } from './FastReviewFooter'

export type RemainingTally = Record<SrsStatus, number>

export interface SessionFooterProps {
  flipped: boolean
  mode: SessionMode
  srs: SrsState | undefined
  now: number
  remaining: RemainingTally
  buckets: Buckets
  onGrade: (grade: Grade) => void
  onAnswer: (outcome: FastOutcome) => void
}

export function SessionFooter({
  flipped,
  mode,
  srs,
  now,
  remaining,
  buckets,
  onGrade,
  onAnswer,
}: SessionFooterProps) {
  const reduce = useReducedMotion()
  const crossfade = { duration: reduce ? 0 : 0.12 }

  // Fast review has no schedule to grade against, so it gets its own two-answer bar rather than a
  // disabled version of this one.
  if (mode === 'fast') {
    return (
      <FastReviewFooter
        flipped={flipped}
        notQuite={buckets.notQuite.length}
        gotIt={buckets.gotIt.length}
        onAnswer={onAnswer}
      />
    )
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-card-glass px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5">
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
              className="flex h-full items-center justify-center"
            >
              <RemainingCounts remaining={remaining} current={srsStatus(srs)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const COUNT_CHIP: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-(--success-surface) text-(--success-on-surface)',
}

const ORDER = ['new', 'learning', 'known'] as const

function RemainingCounts({
  remaining,
  current,
}: {
  remaining: RemainingTally
  current?: SrsStatus
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-2">
      {ORDER.map((key) => (
        <span
          key={key}
          className={cn(
            'inline-flex items-baseline gap-1.5 rounded-pill px-3 py-1.5 text-(length:--p-text-label) font-bold tabular-nums',
            COUNT_CHIP[key],
            current === key && 'ring-2 ring-(--ring)/30',
          )}
        >
          {remaining[key]}
          <span className="font-medium">{t(`srs.${key}` as never)}</span>
        </span>
      ))}
    </div>
  )
}
