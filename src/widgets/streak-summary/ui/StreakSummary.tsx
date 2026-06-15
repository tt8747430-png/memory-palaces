import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flame } from 'lucide-react'
import { buildDayCells, cn, levelFromXp } from '@/shared/lib'
import { Card } from '@/shared/ui'

export interface StreakSummaryProps {
  xp: number
  streakCount: number
  longestStreak: number
  /** `YYYY-MM-DD` UTC keys of every day trained. */
  trainingDays: readonly string[]
  now?: number
  className?: string
}

/** The progress glance: current level + XP-to-next bar, current vs longest streak,
 * and a real last-seven-days strip (computed from `trainingDays`, never faked).
 * Presentational — the page reads the progress store and passes the numbers. */
export function StreakSummary({
  xp,
  streakCount,
  longestStreak,
  trainingDays,
  now = Date.now(),
  className,
}: StreakSummaryProps) {
  const { t } = useTranslation()
  const level = levelFromXp(xp)
  const week = useMemo(() => buildDayCells(trainingDays, 7, now), [trainingDays, now])
  const remaining = level.xpForNextLevel - level.xpInLevel
  const fill = Math.round((level.xpInLevel / level.xpForNextLevel) * 100)

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('progress.level', { level: level.level })}
          </h3>
          <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('progress.xpToNext', { remaining, level: level.level + 1 })}
          </p>
        </div>
        <span className="shrink-0 text-[length:var(--p-text-label)] font-semibold tabular-nums text-heading">
          {t('progress.xpTotal', { xp })}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: `${fill}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="mt-5 flex items-stretch gap-3">
        <StreakStat label={t('progress.currentStreak')} value={streakCount} accent />
        <div className="w-px bg-border" />
        <StreakStat label={t('progress.longestStreak')} value={longestStreak} />
      </div>

      <div className="mt-5 flex justify-between gap-1">
        {week.map((day, index) => (
          <div key={day.key} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                'text-[length:var(--p-text-tiny)] font-semibold',
                day.isToday ? 'text-heading' : 'text-muted-foreground',
              )}
            >
              {day.weekdayInitial}
            </span>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.04, type: 'spring', stiffness: 320, damping: 24 }}
              className={cn(
                'grid size-9 place-items-center rounded-[14px]',
                day.trained
                  ? 'bg-[var(--warning)] shadow-interactive'
                  : day.isToday
                    ? 'border-2 border-secondary bg-card'
                    : 'border border-border bg-info-surface',
              )}
            >
              {day.trained ? (
                <Flame className="size-4 text-[var(--warning-on-fill)]" fill="currentColor" aria-hidden />
              ) : (
                <span
                  className={cn(
                    'size-2 rounded-full',
                    day.isToday ? 'bg-primary/40' : 'bg-primary/15',
                  )}
                  aria-hidden
                />
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function StreakStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <span className="inline-flex items-center gap-1.5">
        {accent ? (
          <Flame className="size-5 text-[var(--warning)]" fill="currentColor" aria-hidden />
        ) : null}
        <span className="text-[30px] font-bold leading-none tabular-nums text-heading">{value}</span>
      </span>
      <span className="mt-1.5 text-[length:var(--p-text-tiny)] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
