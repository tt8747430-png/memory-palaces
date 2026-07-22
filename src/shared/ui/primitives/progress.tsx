import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/lib'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export interface ProgressProps {
  /** Percentage filled, 0–100. Values outside the range are clamped. */
  value: number
  /** Track classes — height, width and track color. */
  className?: string
  /** Fill classes — override the default primary→accent gradient. */
  fillClassName?: string
  /**
   * Fill from zero when the bar first appears. Off by default: a bar mounts at
   * its value and animates only when that value *changes*, so returning to a
   * screen never replays the fill. Turn it on only where the filling is the
   * moment itself — a badge tier, a milestone — not where the bar is just a
   * readout of standing progress.
   */
  animateOnMount?: boolean
  /** Beat to wait before the mount fill; ignored unless `animateOnMount`. */
  delay?: number
  /** Announced value, e.g. "120 XP to level 4". Omit to keep the bar decorative. */
  label?: string
}

/**
 * Progress bar on Base UI's `Progress.Root` for real `progressbar` semantics
 * (`aria-valuenow`/min/max), with a motion-driven fill layered on top. When no
 * `label` is given the bar is decorative (`aria-hidden`) — a thin visual readout,
 * not something a screen reader should announce.
 */
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
