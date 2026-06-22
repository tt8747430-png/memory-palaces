import { type PointerEvent as ReactPointerEvent, type ReactNode, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { clampSwipeOffset, cn, impact, shouldCommitSwipe, SWIPE_DELETE_MAX } from '@/shared/lib'

/** Visual register of the revealed action — `danger` for a destructive remove (the
 * default), `warning` for a reversible "tuck away" like archive. */
export type SwipeTone = 'danger' | 'warning'

const TONE_SURFACE: Record<SwipeTone, string> = {
  danger: 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
  warning: 'bg-[var(--warning-surface)] text-[var(--warning-foreground)]',
}

export interface SwipeRowProps {
  children: ReactNode
  /** Committed when the row is swiped left past the threshold. */
  onSwipe: () => void
  /** The glyph revealed behind the row; defaults to a trash can (destructive remove). */
  revealIcon?: ReactNode
  /** Tints the revealed panel; defaults to `danger`. */
  tone?: SwipeTone
  /** Disable the gesture (children still render and stay tappable). */
  disabled?: boolean
  className?: string
}

/** Movement (px) before the gesture locks to an axis — below this it's still a tap. */
const AXIS_LOCK = 8

/**
 * Wraps a list row so a left-swipe slides it aside to reveal an action panel and commits
 * `onSwipe` once it clears the threshold, with a haptic and a spring. The revealed panel
 * defaults to a destructive trash (danger), but `revealIcon` + `tone` adapt it to a
 * reversible action like archive. Built on plain pointer events (not a gesture lib) so a
 * tap never gets swallowed: tracking only locks to the horizontal axis after real
 * movement, and vertical drags fall through to native scroll (`touch-action: pan-y`). The
 * gesture is additive — the row should keep a visible button as the keyboard/assistive path.
 */
export function SwipeRow({
  children,
  onSwipe,
  revealIcon = <Trash2 className="size-5" />,
  tone = 'danger',
  disabled = false,
  className,
}: SwipeRowProps) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const revealOpacity = useTransform(x, [-SWIPE_DELETE_MAX, -28, 0], [1, 0.35, 0])
  const revealScale = useTransform(x, [-SWIPE_DELETE_MAX, -40, 0], [1, 0.7, 0.6])
  const [committing, setCommitting] = useState(false)
  const drag = useRef<{ startX: number; startY: number; axis: 'h' | 'v' | null; id: number } | null>(null)

  const settle = (to: number) => {
    if (reduce) x.set(to)
    else animate(x, to, { type: 'spring', stiffness: 520, damping: 38 })
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    if (committing) return
    drag.current = { startX: event.clientX, startY: event.clientY, axis: null, id: event.pointerId }
  }

  const onPointerMove = (event: ReactPointerEvent) => {
    const state = drag.current
    if (!state) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (state.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return
      // A vertical intent isn't ours — let the page scroll.
      if (Math.abs(dy) >= Math.abs(dx)) {
        drag.current = null
        return
      }
      state.axis = 'h'
      event.currentTarget.setPointerCapture?.(state.id)
    }
    x.set(clampSwipeOffset(dx))
  }

  const finish = (event: ReactPointerEvent) => {
    const state = drag.current
    drag.current = null
    if (!state || state.axis !== 'h') return
    const dx = event.clientX - state.startX
    if (shouldCommitSwipe(dx, 0)) {
      setCommitting(true)
      impact()
      if (reduce) {
        onSwipe()
        return
      }
      void animate(x, -SWIPE_DELETE_MAX * 3, { duration: 0.2, ease: [0.4, 0, 1, 1] }).finished.then(
        onSwipe,
      )
      return
    }
    settle(0)
  }

  return (
    <div className={cn('relative isolate', className)}>
      <motion.div
        aria-hidden
        style={{ opacity: revealOpacity }}
        className={cn(
          'absolute inset-0 -z-10 flex items-center justify-end rounded-card pr-6',
          TONE_SURFACE[tone],
        )}
      >
        <motion.span style={{ scale: revealScale }}>{revealIcon}</motion.span>
      </motion.div>
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        onPointerDown={disabled ? undefined : onPointerDown}
        onPointerMove={disabled ? undefined : onPointerMove}
        onPointerUp={disabled ? undefined : finish}
        onPointerCancel={disabled ? undefined : finish}
      >
        {children}
      </motion.div>
    </div>
  )
}
