import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Footprints, Plus } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'

export interface TodayTrainingCardProps {
  /** False on first run (no palaces yet): swap to the "create palace" path. */
  hasPalaces: boolean
  /** Whether the picker has a room to drop into; gates the "Start training" path. */
  hasTrainableRoom?: boolean
  /** Cards due today — when > 0 the hero becomes the daily-review launcher. */
  dueCount?: number
  /** Live streak, for the caught-up coaching line. */
  streakCount?: number
  /** Launch the cross-palace daily review (used when cards are due). */
  onStartReview?: () => void
  /** Drop into the top suggested room (used when nothing is due). */
  onStartTraining: () => void
  onCreatePalace: () => void
  className?: string
}

/**
 * The home's primary card: the one action the screen is built around. It carries the
 * old app's "Today's training" craft — a sky-glass hero with a floating emblem that
 * lifts off the surface — and it owns the single next step for the day. When cards are
 * due it *is* the daily review (its button launches the cross-palace session), so the
 * home never competes with a second review CTA; otherwise it starts the top suggested
 * room, and on first run it builds the first palace. The coaching line adapts to what is
 * actually true today (cards due, a live streak, or a quiet day).
 */
export function TodayTrainingCard({
  hasPalaces,
  hasTrainableRoom = true,
  dueCount = 0,
  streakCount = 0,
  onStartReview,
  onStartTraining,
  onCreatePalace,
  className,
}: TodayTrainingCardProps) {
  const { t } = useTranslation()
  const Emblem = hasPalaces ? Footprints : Building2

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

          <HeroAction
            hasPalaces={hasPalaces}
            hasTrainableRoom={hasTrainableRoom}
            dueCount={dueCount}
            onStartReview={onStartReview}
            onStartTraining={onStartTraining}
            onCreatePalace={onCreatePalace}
          />
        </div>
      </div>
    </motion.div>
  )
}

/** Resolves the hero's single action so its label always matches what happens:
 * create on first run, review when due, train when a room is queued, else open the
 * palaces list (never a "Start training" button that lands on a list). */
function HeroAction({
  hasPalaces,
  hasTrainableRoom,
  dueCount,
  onStartReview,
  onStartTraining,
  onCreatePalace,
}: Required<
  Pick<
    TodayTrainingCardProps,
    'hasPalaces' | 'hasTrainableRoom' | 'dueCount' | 'onStartTraining' | 'onCreatePalace'
  >
> &
  Pick<TodayTrainingCardProps, 'onStartReview'>) {
  const { t } = useTranslation()
  const className = 'mt-5 w-full rounded-control'

  if (!hasPalaces) {
    return (
      <Button size="lg" className={className} onClick={onCreatePalace}>
        <Plus className="size-5" aria-hidden />
        {t('home.createPalace')}
      </Button>
    )
  }

  if (dueCount > 0) {
    return (
      <Button size="lg" className={className} onClick={onStartReview ?? onStartTraining}>
        {t(dueCount === 1 ? 'home.reviewDueOne' : 'home.reviewDueOther', { count: dueCount })}
        <ArrowRight className="size-5" aria-hidden />
      </Button>
    )
  }

  return (
    <Button size="lg" className={className} onClick={onStartTraining}>
      {t(hasTrainableRoom ? 'home.startTraining' : 'home.viewPalaces')}
      <ArrowRight className="size-5" aria-hidden />
    </Button>
  )
}
