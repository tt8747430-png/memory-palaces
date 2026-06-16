import { type PointerEvent as ReactPointerEvent, type ReactNode, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { cn, PULL_REFRESH_MAX, pullDistance, shouldRefresh, tick } from '@/shared/lib'

export interface PullToRefreshProps {
  /** Re-pull the screen's data. Awaited so the spinner holds until it resolves. */
  onRefresh: () => void | Promise<void>
  /** Accessible status announced while refreshing. */
  label: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

/** Offset the content rests at while the refresh runs (room for the spinner). */
const REFRESHING_OFFSET = 52

/**
 * Pull down at the very top of the window to refresh. The app scrolls the window (not
 * an inner container), so the gesture only arms when `scrollY <= 0` at press time and
 * the pull is downward; it never calls preventDefault or captures the pointer, so taps
 * on the content and normal scrolling are untouched (the body's
 * `overscroll-behavior-y: contain` suppresses the browser's own bounce).
 *
 * The translate is applied only while a pull is active, so an idle transform never
 * turns this wrapper into the containing block for the header's `position: fixed`
 * compact bar (which would unpin it during normal scrolling).
 */
export function PullToRefresh({
  onRefresh,
  label,
  children,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const reduce = useReducedMotion()
  const y = useMotionValue(0)
  const [active, setActive] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const drag = useRef<{ startY: number; armed: boolean; passed: boolean } | null>(null)

  const indicatorY = useTransform(y, (v) => v - 44)
  const pullOpacity = useTransform(y, [0, 20, PULL_REFRESH_MAX], [0, 0.5, 1])
  const arrowRotate = useTransform(y, [0, PULL_REFRESH_MAX], [0, 180])
  const arrowScale = useTransform(y, [0, PULL_REFRESH_MAX], [0.7, 1])

  const settle = (to: number, onDone?: () => void) => {
    if (reduce) {
      y.set(to)
      onDone?.()
      return
    }
    void animate(y, to, { type: 'spring', stiffness: 420, damping: 36 }).finished.then(() => onDone?.())
  }

  const runRefresh = async () => {
    setRefreshing(true)
    settle(REFRESHING_OFFSET)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
      settle(0, () => setActive(false))
    }
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    if (refreshing) return
    drag.current = { startY: event.clientY, armed: window.scrollY <= 0, passed: false }
  }

  const onPointerMove = (event: ReactPointerEvent) => {
    const state = drag.current
    if (!state || !state.armed) return
    const dy = event.clientY - state.startY
    if (dy <= 0) {
      if (active) y.set(0)
      return
    }
    if (!active) setActive(true)
    const distance = pullDistance(dy)
    y.set(distance)
    const passed = shouldRefresh(distance)
    if (passed !== state.passed) {
      state.passed = passed
      if (passed) tick()
    }
  }

  const finish = () => {
    const state = drag.current
    drag.current = null
    if (!state || !state.armed || !active) return
    if (shouldRefresh(y.get())) void runRefresh()
    else settle(0, () => setActive(false))
  }

  return (
    <motion.div
      className={cn('relative', className)}
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerMove={disabled ? undefined : onPointerMove}
      onPointerUp={disabled ? undefined : finish}
      onPointerCancel={disabled ? undefined : finish}
    >
      <motion.div
        role="status"
        aria-live="polite"
        style={{ y: indicatorY, opacity: refreshing ? 1 : pullOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex justify-center pt-2"
      >
        <span className="grid size-9 place-items-center rounded-full bg-card-glass text-primary shadow-rest">
          {refreshing ? (
            <Loader2 className={cn('size-5', !reduce && 'animate-spin')} aria-hidden />
          ) : (
            <motion.span style={{ rotate: arrowRotate, scale: arrowScale }} className="grid place-items-center">
              <ArrowDown className="size-5" aria-hidden />
            </motion.span>
          )}
        </span>
        {refreshing ? <span className="sr-only">{label}</span> : null}
      </motion.div>

      <motion.div style={active ? { y } : undefined}>{children}</motion.div>
    </motion.div>
  )
}
