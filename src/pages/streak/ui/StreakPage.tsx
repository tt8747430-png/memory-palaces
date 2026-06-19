import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import { CalendarCheck, Flame } from 'lucide-react'
import { dayKey } from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { StreakCalendar } from '@/widgets/streak-calendar'
import { AppScreen, Card, ScreenHeader } from '@/shared/ui'

export interface StreakPageProps {
  /** Return to where you came from (Home or Profile); wired by the route wrapper. */
  onBack?: () => void
}

/** The Streak screen: a warm streak hero (gold is Mindscape's earned-reward color) over
 * two honest figures — days practiced this month and the longest streak — and the full
 * month calendar. Every number derives live from the progress store; no freezes or
 * society to fake. Reached from the Home streak chip and the Profile overview. */
export function StreakPage({ onBack }: StreakPageProps = {}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const progressStore = useProgressStoreApi()
  const progress = useProgressStore(selectProgress)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    progressStore.getState().start()
  }, [progressStore])

  const streakCount = progress?.streakCount ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  const trainingDays = useMemo(() => progress?.trainingDays ?? [], [progress])

  const daysThisMonth = useMemo(() => {
    const prefix = dayKey(now).slice(0, 7) // YYYY-MM
    return trainingDays.filter((day) => day.startsWith(prefix)).length
  }, [trainingDays, now])

  return (
    <AppScreen
      className="pb-28"
      header={
        <ScreenHeader title={t('streak.title')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      <div className="mt-2 flex flex-col gap-5">
        <section
          className="relative overflow-hidden rounded-card-featured p-6"
          style={{ background: 'var(--warning-surface)' }}
        >
          <Flame
            className="pointer-events-none absolute -right-4 -top-3 size-44 text-[var(--warning)] opacity-25"
            fill="currentColor"
            aria-hidden
          />
          <div className="relative">
            <motion.p
              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="text-[64px] font-extrabold leading-none tabular-nums text-[var(--warning-foreground)]"
            >
              {streakCount}
            </motion.p>
            <p className="mt-1 text-[length:var(--p-text-headline)] font-bold text-[var(--warning-foreground)]">
              {t('streak.dayStreak')}
            </p>
            <p className="mt-1 max-w-[14rem] text-[length:var(--p-text-label)] font-medium text-[var(--warning-foreground)]/80">
              {streakCount > 0 ? t('streak.keepItUp') : t('streak.startToday')}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <StreakStatCard
            icon={<CalendarCheck className="size-5" aria-hidden />}
            value={daysThisMonth}
            label={t('streak.daysThisMonth')}
            tone="amber"
          />
          <StreakStatCard
            icon={<Flame className="size-5" fill="currentColor" aria-hidden />}
            value={longestStreak}
            label={t('streak.longest')}
            tone="navy"
          />
        </div>

        <StreakCalendar trainingDays={trainingDays} now={now} />
      </div>
    </AppScreen>
  )
}

function StreakStatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode
  value: number
  label: string
  tone: 'amber' | 'navy'
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={
          tone === 'amber'
            ? 'grid size-10 shrink-0 place-items-center rounded-control bg-[var(--warning-surface)] text-[var(--warning-foreground)]'
            : 'grid size-10 shrink-0 place-items-center rounded-control bg-info-surface text-primary'
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[22px] font-bold leading-none tabular-nums text-heading">{value}</p>
        <p className="mt-1 text-[length:var(--p-text-label)] font-medium leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </Card>
  )
}
