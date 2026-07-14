import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'
import { cardSurface } from './Card'

export interface StatTileProps {
  icon: ReactNode
  value: string
  label: string
  delay?: number
}

const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

export function StatTile({ icon, value, label, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: EASE_OUT_QUART, duration: 0.35 }}
      className={cn(cardSurface, 'p-4')}
    >
      <div className="mb-4 grid size-11 place-items-center rounded-control bg-info-surface text-primary">
        {icon}
      </div>
      <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-heading">
        {value}
      </p>
      <p className="mt-1.5 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
        {label}
      </p>
    </motion.div>
  )
}
