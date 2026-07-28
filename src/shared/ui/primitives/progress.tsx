import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { motion, useReducedMotion } from 'motion/react'
import { cn, EASE_OUT } from '@/shared/lib'

export interface ProgressProps {
  value: number
  className?: string
  fillClassName?: string
  animateOnMount?: boolean
  delay?: number
  label?: string
}

export function Progress({
  value,
  className,
  fillClassName,
  animateOnMount = false,
  delay = 0,
  label,
}: ProgressProps) {
  const reduce = useReducedMotion()
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
  const fillFromZero = animateOnMount && !reduce

  return (
    <ProgressPrimitive.Root
      value={pct}
      data-slot="progress"
      className={cn('block h-2 overflow-hidden rounded-full bg-primary/[0.08]', className)}
      {...(label ? { 'aria-label': label } : { 'aria-hidden': true })}
    >
      <motion.span
        data-slot="progress-indicator"
        className={cn(
          'block h-full rounded-full bg-gradient-to-r from-primary to-accent',
          fillClassName,
        )}
        initial={fillFromZero ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                duration: fillFromZero ? 0.7 : 0.45,
                delay: fillFromZero ? delay : 0,
                ease: EASE_OUT,
              }
        }
      />
    </ProgressPrimitive.Root>
  )
}
