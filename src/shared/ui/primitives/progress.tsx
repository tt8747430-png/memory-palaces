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
      className={cn('block h-2 overflow-hidden rounded-full bg-primary/8', className)}
      {...(label ? { 'aria-label': label } : { 'aria-hidden': true })}
    >
      {/* `scaleX`, not `width`. Width is a layout property: animating it relayouts and repaints the
          bar on every frame, and every `<Progress>` in the app — the profile hero, each badge, each
          achievement — runs one at once. `origin-left` is what makes the transform read as filling
          rather than growing out of the middle. `HeaderTrack` does the same thing for the same
          reason. CODE_STYLE §9. */}
      <motion.span
        data-slot="progress-indicator"
        className={cn(
          'block h-full w-full origin-left rounded-full bg-linear-to-r from-primary to-accent',
          fillClassName,
        )}
        initial={fillFromZero ? { scaleX: 0 } : false}
        animate={{ scaleX: pct / 100 }}
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
