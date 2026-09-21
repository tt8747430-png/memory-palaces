import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Check, Flag, GraduationCap } from 'lucide-react'
import { Button } from './primitives/button'
import { GlassCard } from './GlassCard'
import { EASE_OUT } from '@/shared/lib'

export interface OverviewStat {
  key: string
  label: string
  value: number
}

/** What a variant calls the state where it has nothing left to offer, and the way out of it. */
const DONE = {
  spaced: { headingKey: 'study.caughtUp', aheadKey: 'study.studyAhead' },
  fast: { headingKey: 'study.passComplete', aheadKey: 'study.studyAgain' },
} as const

export interface StudyOverviewCardProps {
  variant: 'fast' | 'spaced'
  count: number
  /**
   * Nothing left to offer *and* that is the whole story — everything due is done, or every card
   * has been got right. A count of zero on its own is not: a deck of frozen cards offers nothing
   * either, and telling that learner they are caught up would be a lie.
   */
  caughtUp: boolean
  countLabel: string
  stats: OverviewStat[]
  onStudy: () => void
  onStudyAhead?: () => void
  /** Offered whenever the deck has flagged cards, caught up or not. */
  flaggedCount?: number
  onStudyFlagged?: () => void
}

export function StudyOverviewCard({
  variant,
  count,
  caughtUp,
  countLabel,
  stats,
  onStudy,
  onStudyAhead,
  flaggedCount = 0,
  onStudyFlagged,
}: StudyOverviewCardProps) {
  const { t } = useTranslation()

  const flagged =
    onStudyFlagged && flaggedCount > 0 ? (
      <Button variant="secondary" className="w-full" onClick={onStudyFlagged}>
        <Flag className="size-4.5" aria-hidden />
        {t('study.studyFlagged', { count: flaggedCount })}
      </Button>
    ) : null

  // Done, under either algorithm: due today for spaced, every card got right for fast. The
  // buckets would all read zero, so the card says the one thing that is true instead.
  if (caughtUp) {
    const done = DONE[variant]
    return (
      <GlassCard className="flex flex-col items-center gap-3 py-7 text-center">
        <span className="grid size-12 place-items-center rounded-card-featured bg-card text-(--success-foreground) shadow-rest">
          <Check className="size-6" aria-hidden />
        </span>
        <p className="text-body font-semibold text-heading">{t(done.headingKey)}</p>
        {onStudyAhead ? (
          <Button variant="secondary" onClick={onStudyAhead}>
            {t(done.aheadKey)}
          </Button>
        ) : null}
        {flagged}
      </GlassCard>
    )
  }

  return (
    <GlassCard className="space-y-4 text-center">
      <div>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="text-figure-lg font-bold leading-none tabular-nums text-heading"
        >
          {count}
        </motion.p>
        <p className="mt-1 text-body font-medium text-muted-foreground">{countLabel}</p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.key} className="flex flex-col rounded-control bg-info-surface px-2 py-2">
            <dt className="order-2 mt-1 text-tiny font-medium text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="order-1 text-body font-bold leading-none tabular-nums text-heading">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <Button className="w-full" onClick={onStudy}>
          <GraduationCap className="size-4.5" aria-hidden />
          {t('study.studyCards')}
        </Button>
        {flagged}
      </div>
    </GlassCard>
  )
}
