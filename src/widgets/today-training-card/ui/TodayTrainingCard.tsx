import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Footprints, Plus } from 'lucide-react'
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
  const Emblem = hasPalaces ? Footprints : Building2

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <GlassCard tone="card" className="relative overflow-hidden">
        {/* Soft daylight glow — atmosphere on the white surface, keeps the hero distinct. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-[var(--accent)]/15 blur-2xl"
        />

        <div className="relative">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-card bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-interactive"
          >
            <Emblem className="size-6" />
          </span>

          <h2 className="mt-4 text-pretty text-[length:var(--p-text-headline)] font-bold text-heading">
            {t(hasPalaces ? 'home.todayTitle' : 'home.buildTitle')}
          </h2>
          <p className="mt-1.5 text-[length:var(--p-text-body)] text-[color:var(--text-secondary)]">
            {t(hasPalaces ? 'home.todaySubtitle' : 'home.buildSubtitle')}
          </p>

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
      </GlassCard>
    </motion.div>
  )
}
