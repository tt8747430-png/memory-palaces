import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Star } from 'lucide-react'
import { GlassCard } from '@/shared/ui'

export interface PalaceSummary {
  id: string
  name: string
  icon: string
  /** Mastery 0–100 (share of completed rooms). */
  progress: number
  roomsCompleted: number
  totalRooms: number
}

export interface PalacesOverviewProps {
  palaces: PalaceSummary[]
  onOpenPalace: (id: string) => void
  onViewAll: () => void
  className?: string
}

const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const MASTERED_AT = 70

/** The home's palace grid: each palace as a glass card with a progress ring, tapping
 * through to its detail; "View all" jumps to the Palaces tab. Hidden on first run. */
export function PalacesOverview({
  palaces,
  onOpenPalace,
  onViewAll,
  className,
}: PalacesOverviewProps) {
  const { t } = useTranslation()
  if (palaces.length === 0) return null

  return (
    <section aria-labelledby="palaces-overview-heading" className={className}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2
          id="palaces-overview-heading"
          className="text-[length:var(--p-text-sub)] font-bold text-heading"
        >
          {t('home.palacesTitle')}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-[length:var(--p-text-label)] font-semibold text-primary transition-transform active:scale-[0.98]"
        >
          {t('home.viewAll')}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {palaces.map((palace) => (
          <motion.button
            key={palace.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenPalace(palace.id)}
            className="text-left"
          >
            <GlassCard className="relative flex h-full flex-col items-center gap-1 p-4 text-center">
              {palace.progress >= MASTERED_AT ? (
                <span
                  role="img"
                  aria-label={t('home.mastered')}
                  className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[var(--warning)] text-[var(--warning-on-fill)]"
                >
                  <Star className="size-3.5" fill="currentColor" aria-hidden />
                </span>
              ) : null}
              <ProgressRing id={palace.id} progress={palace.progress} icon={palace.icon} />
              <span className="mt-1 block w-full truncate text-[length:var(--p-text-label)] font-semibold text-heading">
                {palace.name}
              </span>
              <span className="block text-[length:var(--p-text-tiny)] text-muted-foreground">
                {t('home.roomsCount', {
                  completed: palace.roomsCompleted,
                  total: palace.totalRooms,
                })}
              </span>
            </GlassCard>
          </motion.button>
        ))}
      </div>
    </section>
  )
}

function ProgressRing({ id, progress, icon }: { id: string; progress: number; icon: string }) {
  const pct = Math.min(100, Math.max(0, progress))
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
  return (
    <span className="relative grid size-16 place-items-center">
      <svg viewBox="0 0 80 80" className="size-16 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-[22px] leading-none">{icon || '🏛️'}</span>
    </span>
  )
}
