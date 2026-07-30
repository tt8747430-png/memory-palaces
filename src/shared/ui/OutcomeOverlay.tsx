import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

const TONE = {
  success: 'bg-(--success-surface) text-(--success-on-surface)',
  info: 'bg-info-surface text-accent',
} as const

export interface OutcomeOverlayProps {
  /** The mark in the medallion — sized by the caller, coloured by `tone`. */
  icon: ReactNode
  title: string
  tone?: keyof typeof TONE
  /** The score lines and whatever the user does next. */
  children: ReactNode
}

/**
 * The curtain a finished run drops over its panel: one medallion, one headline,
 * then whatever that run has to report. Study, quiz and anything else that ends
 * share it, so finishing looks the same wherever the user got there.
 */
export function OutcomeOverlay({ icon, title, tone = 'success', children }: OutcomeOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-card-glass px-6 text-center"
    >
      <div className={cn('mb-3 grid size-24 place-items-center rounded-full', TONE[tone])}>
        {icon}
      </div>
      <h2 className="text-(length:--p-text-headline) font-bold text-heading">{title}</h2>
      {children}
    </motion.div>
  )
}
