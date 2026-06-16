import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, GlassCard } from '@/shared/ui'

export interface TodayTrainingCardProps {
  /** False on first run (no palaces yet): swap to the "create palace" path. */
  hasPalaces: boolean
  onStartTraining: () => void
  onCreatePalace: () => void
  className?: string
}

/** The home's primary card: the one action the screen is built around. With palaces
 * it invites today's session; on first run it invites building the first palace. The
 * old daily-goal % bar is dropped — StreakSummary already owns level/XP, and the new
 * domain has no daily-goal metric to honestly fill it. */
export function TodayTrainingCard({
  hasPalaces,
  onStartTraining,
  onCreatePalace,
  className,
}: TodayTrainingCardProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <GlassCard tone="sky" className="relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -right-3 -top-3 grid size-16 place-items-center rounded-card bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-interactive"
        >
          <Sparkles className="size-7" />
        </span>

        <h2 className="pr-16 text-[length:var(--p-text-title)] font-bold text-heading">
          {t(hasPalaces ? 'home.todayTitle' : 'home.buildTitle')}
        </h2>
        <p className="mt-1.5 pr-12 text-[length:var(--p-text-body)] text-[color:var(--text-on-accent)]/80">
          {t(hasPalaces ? 'home.todaySubtitle' : 'home.buildSubtitle')}
        </p>

        <Button
          size="lg"
          className={cn('mt-5 w-full rounded-pill')}
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
      </GlassCard>
    </motion.div>
  )
}
