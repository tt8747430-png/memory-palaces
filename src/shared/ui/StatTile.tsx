import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn, EASE_OUT } from '@/shared/lib'
import { cardSurface } from './primitives/card'

/**
 * Which surface the tile stands on. `page` is a card on the page's canvas; `chrome` is a quieter,
 * centred tile for the app's own dark block (`.chrome`), where a lifted white card would be the
 * loudest thing on the screen instead of the figure it holds.
 */
export type StatTileTone = 'page' | 'chrome'

export interface StatTileProps {
  icon: ReactNode
  value: string
  label: string
  tone?: StatTileTone
  /** Seconds before it rises in, so a row of tiles can stagger. */
  delay?: number
}

const TONE: Record<StatTileTone, { box: string; icon: string; value: string; label: string }> = {
  page: {
    box: cn(cardSurface, 'p-4'),
    icon: 'mb-4 grid size-11 place-items-center rounded-control bg-info-surface text-primary',
    value: 'text-figure-md tracking-tight',
    label: 'mt-1.5 text-label font-medium',
  },
  chrome: {
    box: 'flex flex-col items-center gap-1.5 rounded-card border border-border bg-info-surface p-3',
    icon: '[&_svg]:size-4',
    value: 'text-figure-sm',
    label: 'text-tiny font-semibold',
  },
}

export function StatTile({ icon, value, label, tone = 'page', delay = 0 }: StatTileProps) {
  const reduce = useReducedMotion()
  const look = TONE[tone]
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : delay, ease: EASE_OUT, duration: reduce ? 0.15 : 0.35 }}
      className={look.box}
    >
      <div aria-hidden className={cn('text-muted-foreground', look.icon)}>
        {icon}
      </div>
      {/* Figure first, label under it: a stat reads as a number at a glance, not a sentence. */}
      <p className={cn('font-bold leading-none tabular-nums text-heading', look.value)}>{value}</p>
      <p className={cn('text-muted-foreground', look.label)}>{label}</p>
    </motion.div>
  )
}
