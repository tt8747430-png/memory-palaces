import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
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

/** One button in a multi-action swipe tray. Array order is left→right, so the LAST action
 * sits at the trailing (far-right) edge — the slot for the most destructive one. */
export interface SwipeAction {
  id: string
  /** Glyph shown in the tray button. */
  icon: ReactNode
  /** Caption under the glyph, and the button's accessible name. */
  label: string
  /** Tints the button; defaults to `danger`. */
  tone?: SwipeTone
  onAction: () => void
}

export interface SwipeRowProps {
  children: ReactNode
  /** Single-action mode: committed when the row is swiped left past the threshold. Ignored
   * when {@link actions} is provided. */
  onSwipe?: () => void
  /** The glyph revealed behind the row in single-action mode; defaults to a trash can. */
  revealIcon?: ReactNode
  /** Tints the single-action revealed panel; defaults to `danger`. */
  tone?: SwipeTone
  /** Multi-action mode: a left-swipe reveals this tray of buttons (last = far right) and
   * rests open so the user picks one. Takes precedence over {@link onSwipe}. */
  actions?: SwipeAction[]
  /** Disable the gesture (children still render and stay tappable). */
  disabled?: boolean
  className?: string
}

/** Movement (px) before the gesture locks to an axis — below this it's still a tap. */
const AXIS_LOCK = 8
/** Width (px) of each revealed tray button in multi-action mode. */
const ACTION_WIDTH = 76

/**
 * Wraps a list row so a left-swipe slides it aside to reveal an action. With {@link
 * SwipeRowProps.onSwipe} it's a single commit-on-threshold action; with {@link
 * SwipeRowProps.actions} it reveals a tray of buttons that rests open for the user to pick
 * (the last action sits at the far right). Built on plain pointer events (not a gesture lib)
 * so a tap never gets swallowed: tracking only locks to the horizontal axis after real
 * movement, and vertical drags fall through to native scroll (`touch-action: pan-y`). The
 * gesture is additive — the row should keep a visible menu as the keyboard/assistive path.
 */
export function SwipeRow(props: SwipeRowProps) {
  if (props.actions && props.actions.length > 0) {
    return <MultiActionSwipeRow {...props} actions={props.actions} />
  }
  return <SingleActionSwipeRow {...props} />
}

function SingleActionSwipeRow({
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
  const drag = useRef<{ startX: number; startY: number; axis: 'h' | 'v' | null; id: number } | null>(null)

  const settle = (to: number) => {
    if (reduce) x.set(to)
    else animate(x, to, { type: 'spring', stiffness: 520, damping: 38 })
  }

  const onPointerDown = (event: ReactPointerEvent) => {
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
    // Fire the action, then spring the row back to rest. The row never flies off-screen on its
    // own: a confirm-gated action (folder delete) can be cancelled, and an immediate one
    // (archive, dismiss) drops the row from the list and unmounts it before the spring shows.
    // Either path avoids leaving the row stranded half-swiped — the old bug behind the hang.
    if (shouldCommitSwipe(dx, 0)) {
      impact()
      onSwipe?.()
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

function MultiActionSwipeRow({
  children,
  actions,
  disabled = false,
  className,
}: SwipeRowProps & { actions: SwipeAction[] }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const trayWidth = actions.length * ACTION_WIDTH
  const [open, setOpen] = useState(false)
  const drag = useRef<{ startX: number; startY: number; axis: 'h' | 'v' | null; id: number } | null>(null)
  // The trailing click of a drag (mouse synthesizes one) must not fall through to the row's
  // own tap; swallow exactly one click after any horizontal drag. Reset on each pointerdown so
  // a stale flag can never block a later genuine tap.
  const suppressClick = useRef(false)

  const settle = (to: number) => {
    if (reduce) x.set(to)
    else animate(x, to, { type: 'spring', stiffness: 520, damping: 40 })
  }

  const close = () => {
    setOpen(false)
    settle(0)
  }

  // A disabled row (drag in progress, select mode) can't be left resting open.
  useEffect(() => {
    if (disabled && open) {
      setOpen(false)
      x.set(0)
    }
  }, [disabled, open, x])

  const clamp = (offset: number) => {
    if (offset >= 0) return offset * 0.18
    return Math.max(offset, -(trayWidth + 28))
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    suppressClick.current = false
    drag.current = { startX: event.clientX, startY: event.clientY, axis: null, id: event.pointerId }
  }

  const onPointerMove = (event: ReactPointerEvent) => {
    const state = drag.current
    if (!state) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (state.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        drag.current = null
        return
      }
      state.axis = 'h'
      event.currentTarget.setPointerCapture?.(state.id)
    }
    // Drag is relative to wherever the row is resting (open = already pulled out by trayWidth).
    x.set(clamp(dx + (open ? -trayWidth : 0)))
  }

  const finish = (event: ReactPointerEvent) => {
    const state = drag.current
    drag.current = null
    if (!state || state.axis !== 'h') return
    suppressClick.current = true
    const offset = event.clientX - state.startX + (open ? -trayWidth : 0)
    // Past ~half the tray, rest open showing every action; otherwise snap shut.
    if (-offset >= trayWidth * 0.45) {
      if (!open) impact()
      setOpen(true)
      settle(-trayWidth)
    } else {
      setOpen(false)
      settle(0)
    }
  }

  const onClickCapture = (event: ReactMouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    // While the tray is open, a tap on the row closes it instead of activating the row.
    if (open) {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  return (
    <div className={cn('relative isolate', className)}>
      {/* The revealed tray, pinned to the right and sitting behind the row; the row's opaque
          surface hides it at rest and uncovers it as it slides left. `aria-hidden` because the
          same actions live in the row's own overflow menu (the keyboard/assistive path). */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 flex overflow-hidden rounded-r-card"
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            tabIndex={-1}
            aria-label={action.label}
            onClick={() => {
              impact()
              close()
              action.onAction()
            }}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              'flex h-full flex-col items-center justify-center gap-1 text-[length:var(--p-text-tiny)] font-semibold transition-[filter] active:brightness-95',
              TONE_SURFACE[action.tone ?? 'danger'],
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        onPointerDown={disabled ? undefined : onPointerDown}
        onPointerMove={disabled ? undefined : onPointerMove}
        onPointerUp={disabled ? undefined : finish}
        onPointerCancel={disabled ? undefined : finish}
        onClickCapture={onClickCapture}
      >
        {children}
      </motion.div>
    </div>
  )
}
