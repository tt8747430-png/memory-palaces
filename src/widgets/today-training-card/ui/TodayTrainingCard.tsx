import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Footprints, Plus } from 'lucide-react'
import { cn, levelFromXp } from '@/shared/lib'
import { Button } from '@/shared/ui'

export interface TodayTrainingCardProps {
  /** False on first run (no palaces yet): swap to the "create palace" path. */
  hasPalaces: boolean
  onStartTraining: () => void
  onCreatePalace: () => void
  /** Real "today" signals — drive the coaching line and the honest level meter. */
  dueCount?: number
  xp?: number
  streakCount?: number
  className?: string
}

/**
 * The home's primary card: the one action the screen is built around. It carries the
 * old app's "Today's training" craft — a sky-glass hero, a floating emblem that lifts
 * off the surface, and an animated meter — but the meter is bound to real level/XP
 * progress (never a fabricated daily-goal %), and the coaching line adapts to what's
 * actually true today (cards due, a live streak, or a quiet day).
 */
export function TodayTrainingCard({
  hasPalaces,
  onStartTraining,
  onCreatePalace,
  dueCount = 0,
  xp = 0,
  streakCount = 0,
  className,
}: TodayTrainingCardProps) {
  const { t } = useTranslation()
  const Emblem = hasPalaces ? Footprints : Building2
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100))
  const remaining = xpForNextLevel - xpInLevel

  const subtitle = !hasPalaces
    ? t('home.buildSubtitle')
    : dueCount > 0
      ? t(dueCount === 1 ? 'home.todayDueOne' : 'home.todayDueOther', { count: dueCount })
      : streakCount > 0
        ? t('home.todayCaughtUp', { count: streakCount })
        : t('home.todayNoDue')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative', className)}
    >
      {/* Floating emblem — lifts off the card like the old app's hero illustration. */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.84, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="drop-shadow-float absolute -top-3 right-4 z-10 grid size-16 place-items-center rounded-card-featured bg-card-glass text-primary"
      >
        <Emblem className="size-7" strokeWidth={1.75} />
      </motion.span>

      {/* Sky-glass hero surface (the old light-blue gradient, on semantic tokens). */}
      <div className="relative overflow-hidden rounded-card-featured bg-gradient-to-br from-secondary/90 to-secondary/65 p-5 shadow-featured backdrop-blur-md">
        {/* Soft white sheen, top-left, for the daylit glass feel. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent"
        />

        <div className="relative">
          <h2 className="max-w-[78%] text-pretty text-[length:var(--p-text-headline)] font-bold text-heading">
            {t(hasPalaces ? 'home.todayTitle' : 'home.buildTitle')}
          </h2>
          <p className="mt-1.5 max-w-[88%] text-[length:var(--p-text-body)] font-medium text-[color:var(--text-heading)]/80">
            {subtitle}
          </p>

          {hasPalaces ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[length:var(--p-text-label)] font-semibold text-[color:var(--text-heading)]/80">
                <span>{t('home.levelShort', { level })}</span>
                <span className="tabular-nums">{t('home.xpToNext', { remaining, next: level + 1 })}</span>
              </div>
              <div className="relative h-2 rounded-full bg-[color:var(--primary)]/12">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${fill}%` }}
                  transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.span
                  aria-hidden
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card shadow-rest"
                  initial={{ left: '0%', scale: 0 }}
                  animate={{ left: `${fill}%`, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ) : null}

          <Button
            size="lg"
            className="mt-5 w-full rounded-pill"
            onClick={hasPalaces ? onStartTraining : onCreatePalace}
          >
            {hasPalaces ? (
              <>
                {t('home.startTraining')}
                <ArrowRight className="size-5" aria-hidden />
              </>
            ) : (
              <>
                <Plus className="size-5" aria-hidden />
                {t('home.createPalace')}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
