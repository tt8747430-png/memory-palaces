import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

export interface DropIndicatorProps {
  position: 'before' | 'after'
  inset?: number
  className?: string
}

export function DropIndicator({ position, inset = 0, className }: DropIndicatorProps) {
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, scaleX: 0.9 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.9 }}
      transition={{ type: 'spring', stiffness: 700, damping: 34 }}
      style={{ left: inset }}
      className={cn(
        'pointer-events-none absolute right-0 z-40 h-[3px] origin-left rounded-full bg-accent',
        position === 'before' ? '-top-[5px]' : '-bottom-[5px]',
        className,
      )}
    >
      <span className="absolute -left-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-accent ring-2 ring-background" />
    </motion.span>
  )
}
