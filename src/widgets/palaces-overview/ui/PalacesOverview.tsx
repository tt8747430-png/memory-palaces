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

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const MASTERED_AT = 70

/** The home's palace grid: each palace is a sky-glass card with its icon lifting off
 * the surface (the method-of-loci "spatial" feel) over a progress ring that states the
 * real mastery %. Tapping opens the palace; "View all" jumps to the Palaces tab.
 * Hidden on first run. */
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
          className="flex items-center gap-1 rounded-pill px-2 py-1 text-[length:var(--p-text-label)] font-semibold text-primary transition-transform active:scale-[0.98]"
        >
          {t('home.viewAll')}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Generous vertical gap leaves room for each icon to float above its card. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-4">
        {palaces.map((palace, index) => (
          <motion.button
            key={palace.id}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenPalace(palace.id)}
            className="relative text-left"
          >
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 0.82, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="drop-shadow-float pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-[34px] leading-none"
            >
              {palace.icon || '🏛️'}
            </motion.span>

            <GlassCard
              tone="card"
              className="relative flex h-full flex-col items-center gap-1 px-3 pb-4 pt-8 text-center"
            >
              {palace.progress >= MASTERED_AT ? (
                <span
                  role="img"
                  aria-label={t('home.mastered')}
                  className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[var(--warning)] text-[var(--warning-on-fill)] shadow-interactive"
                >
                  <Star className="size-3.5" fill="currentColor" aria-hidden />
                </span>
              ) : null}
              <ProgressRing id={palace.id} progress={palace.progress} />
              <span className="mt-1.5 block w-full truncate text-[length:var(--p-text-label)] font-semibold text-heading">
                {palace.name}
              </span>
              <span className="block text-[length:var(--p-text-tiny)] font-medium text-[color:var(--text-heading)]/65">
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

function ProgressRing({ id, progress }: { id: string; progress: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)))
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
  return (
    <span className="relative grid size-[68px] place-items-center">
      <svg viewBox="0 0 64 64" className="size-[68px] -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-[length:var(--p-text-title)] font-bold tabular-nums text-heading">
        {pct}
        <span className="text-[length:var(--p-text-tiny)] font-semibold">%</span>
      </span>
    </span>
  )
}
