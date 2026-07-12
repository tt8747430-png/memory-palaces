import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

export interface EmptyStateProps {
  icon?: ReactNode
  emoji?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <div className="mb-5 grid size-16 place-items-center rounded-card-featured bg-info-surface text-accent">
        {icon ?? (emoji ? <span className="text-3xl">{emoji}</span> : null)}
      </div>
      <h3 className="mb-2 text-balance text-[length:var(--p-text-sub)] font-semibold text-heading">
        {title}
      </h3>
      <p className="mb-6 max-w-[34ch] text-pretty text-[length:var(--p-text-body)]">
        {description}
      </p>
      {action}
    </motion.div>
  )
}
