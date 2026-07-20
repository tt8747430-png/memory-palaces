import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

export interface DropIndicatorProps {
  /** Which seam of the row the dragged item would land in. */
  position: 'before' | 'after'
  /** Indent, in px, so the line starts where the row's content starts. */
  inset?: number
  className?: string
}

/**
 * The seam a dragged row will land in. It lives in the gap between rows, which
 * is the whole point: a line *between* things can't be mistaken for a drop
 * *into* a thing — that state is carried by the target row's ring instead.
 */
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
      {/* A dot at the head of the line, the way an insertion caret reads. */}
      <span className="absolute -left-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-accent ring-2 ring-background" />
    </motion.span>
  )
}
