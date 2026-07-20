import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Check, GraduationCap } from 'lucide-react'
import { Button, GlassCard } from '@/shared/ui'

export interface StudyOverviewCardProps {
  count: number
  breakdown: { new: number; learning: number; known: number }
  onStudy: () => void
  onStudyAhead?: () => void
}

export function StudyOverviewCard({
  count,
  breakdown,
  onStudy,
  onStudyAhead,
}: StudyOverviewCardProps) {
  const { t } = useTranslation()

  if (count === 0) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 py-7 text-center">
        <span className="grid size-12 place-items-center rounded-card-featured bg-card text-[var(--success-foreground)] shadow-rest">
          <Check className="size-6" aria-hidden />
        </span>
        <p className="text-[length:var(--ms-text-sub)] font-semibold text-heading">
          {t('study.caughtUp')}
        </p>
        {onStudyAhead ? (
          <Button variant="secondary" onClick={onStudyAhead}>
            {t('study.studyAhead')}
          </Button>
        ) : null}
      </GlassCard>
    )
  }

  const items: Array<{ key: 'new' | 'learning' | 'known'; value: number }> = [
    { key: 'new', value: breakdown.new },
    { key: 'learning', value: breakdown.learning },
    { key: 'known', value: breakdown.known },
  ]

  return (
    <GlassCard className="space-y-4 text-center">
      <div>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[3.5rem] font-bold leading-none tabular-nums text-heading"
        >
          {count}
        </motion.p>
        <p className="mt-1 text-[length:var(--ms-text-body)] font-medium text-secondary">
          {t(count === 1 ? 'study.cardsForTodayOne' : 'study.cardsForTodayOther', { count })}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-control bg-info-surface px-2 py-2">
            <dd className="text-[length:var(--ms-text-sub)] font-bold leading-none tabular-nums text-heading">
              {item.value}
            </dd>
            <dt className="mt-1 text-[length:var(--ms-text-tiny)] font-medium text-secondary">
              {t(`srs.${item.key}`)}
            </dt>
          </div>
        ))}
      </dl>

      <Button className="w-full" onClick={onStudy}>
        <GraduationCap className="size-[18px]" aria-hidden />
        {t('study.studyCards')}
      </Button>
    </GlassCard>
  )
}
