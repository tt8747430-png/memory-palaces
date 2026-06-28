import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { SwipeTone } from '@/shared/config/swipe'
import { cn, impact } from '@/shared/lib'

export type { SwipeTone }

/** Solid, saturated action surfaces (iOS-Mail register) — not the muted tints used elsewhere.
 * Amber needs dark text; the rest carry white. */
const TONE_SURFACE: Record<SwipeTone, string> = {
  danger: 'bg-[var(--danger)] text-white',
  warning: 'bg-[var(--warning)] text-[var(--p-navy-900)]',
  success: 'bg-[var(--success)] text-white',
  accent: 'bg-[var(--accent)] text-white',
  neutral: 'bg-[var(--p-gray-500)] text-white',
}

/** One button in a swipe tray. */
export interface SwipeAction {
  id: string
  /** Glyph shown in the tray button. */
  icon: ReactNode
  /** Caption under the glyph, and the button's accessible name. */
  label: string
  /** Tints the button; defaults to `neutral`. */
  tone?: SwipeTone
  onAction: () => void
}

export interface SwipeRowProps {
  children: ReactNode
  /** Revealed by swiping the row RIGHT (tray on the left edge). Index 0 is the edge-most
   * action — the one a full swipe auto-fires. */
  leading?: SwipeAction[]
  /** Revealed by swiping the row LEFT (tray on the right edge). The LAST action is the
   * edge-most — the one a full swipe auto-fires. */
  trailing?: SwipeAction[]
  /** Disable the gesture (children still render and stay tappable). */
  disabled?: boolean
  className?: string
}

/** Movement (px) before the gesture locks to an axis — below this it's still a tap. */
const AXIS_LOCK = 8
/** Width (px) of each tray button. */
const ACTION_WIDTH = 82
/** Share of the row width past which a full swipe arms the edge-most action. */
const FULL_SWIPE_RATIO = 0.5

type Side = 'leading' | 'trailing'

/**
 * Wraps a list row with the iOS-Mail swipe pattern. A short swipe rests the row open over a
 * tray of actions (the user taps one); a long swipe past ~half the row arms the edge-most
 * action of that side and releasing auto-fires it, the action's surface expanding to fill as
 * it arms. Built on plain pointer events so a tap is never swallowed — tracking locks to the
 * horizontal axis only after real movement, and vertical drags fall through to native scroll
 * (`touch-action: pan-y`). The gesture is additive: the row keeps its own menu as the
 * keyboard/assistive path, so the trays are `aria-hidden`.
 */
export function SwipeRow({
  children,
  leading = [],
  trailing = [],
  disabled = false,
  className,
}: SwipeRowProps) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<Side | null>(null)
  const [armed, setArmed] = useState<Side | null>(null)
  const wasArmed = useRef<Side | null>(null)

  const hasLeading = leading.length > 0
  const hasTrailing = trailing.length > 0
  const leadingWidth = leading.length * ACTION_WIDTH
  const trailingWidth = trailing.length * ACTION_WIDTH

  const leadingOpacity = useTransform(x, (v) => (v > 0 ? 1 : 0))
  const trailingOpacity = useTransform(x, (v) => (v < 0 ? 1 : 0))

  const drag = useRef<{ startX: number; startY: number; axis: 'h' | 'v' | null; id: number } | null>(
    null,
  )

  const settle = (to: number) => {
    if (reduce) x.set(to)
    else animate(x, to, { type: 'spring', stiffness: 520, damping: 42 })
  }

  const close = () => {
    setOpen(null)
    setArmed(null)
    settle(0)
  }

  // A disabled row (drag in flight, select mode) can't be left resting open.
  useEffect(() => {
    if (disabled && (open || x.get() !== 0)) {
      setOpen(null)
      setArmed(null)
      x.set(0)
    }
  }, [disabled, open, x])

  const fullThreshold = () => {
    const w = containerRef.current?.offsetWidth ?? 320
    return w * FULL_SWIPE_RATIO
  }

  // Resistance past the rest-open width so the row feels weighted but a full swipe stays
  // reachable; hard-stopped a touch beyond the row width.
  const clampOffset = (raw: number) => {
    if (raw < 0) {
      if (!hasTrailing) return raw * 0.12
      if (raw >= -trailingWidth) return raw
      const past = -raw - trailingWidth
      return -(trailingWidth + past * 0.7)
    }
    if (raw > 0) {
      if (!hasLeading) return raw * 0.12
      if (raw <= leadingWidth) return raw
      const past = raw - leadingWidth
      return leadingWidth + past * 0.7
    }
    return 0
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
      id: event.pointerId,
    }
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
    const base = open === 'trailing' ? -trailingWidth : open === 'leading' ? leadingWidth : 0
    const next = clampOffset(dx + base)
    x.set(next)

    const limit = fullThreshold()
    const nextArmed: Side | null =
      next <= -limit && hasTrailing ? 'trailing' : next >= limit && hasLeading ? 'leading' : null
    if (nextArmed !== wasArmed.current) {
      wasArmed.current = nextArmed
      setArmed(nextArmed)
      if (nextArmed) impact()
    }
  }

  const finish = (event: ReactPointerEvent) => {
    const state = drag.current
    drag.current = null
    if (!state || state.axis !== 'h') return
    suppressClick.current = true
    const base = open === 'trailing' ? -trailingWidth : open === 'leading' ? leadingWidth : 0
    const offset = clampOffset(event.clientX - state.startX + base)
    const limit = fullThreshold()
    wasArmed.current = null
    setArmed(null)

    // Full swipe: auto-fire the edge-most action, then return to rest. A destructive action
    // unmounts the row before the spring shows; a reversible one springs back.
    if (offset <= -limit && hasTrailing) {
      impact()
      const action = trailing[trailing.length - 1]!
      action.onAction()
      close()
      return
    }
    if (offset >= limit && hasLeading) {
      impact()
      const action = leading[0]!
      action.onAction()
      close()
      return
    }
    // Short swipe: rest open over the tray if past half its width, else snap shut.
    if (offset <= -trailingWidth * 0.5 && hasTrailing) {
      setOpen('trailing')
      settle(-trailingWidth)
    } else if (offset >= leadingWidth * 0.5 && hasLeading) {
      setOpen('leading')
      settle(leadingWidth)
    } else {
      close()
    }
  }

  // The synthetic click a mouse drag trails must not fall through to the row's own tap;
  // swallow exactly one after any horizontal drag, and a tap while open closes instead.
  const suppressClick = useRef(false)
  const onClickCapture = (event: ReactMouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (open) {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const fireFromTray = (action: SwipeAction) => {
    impact()
    close()
    action.onAction()
  }

  return (
    <div ref={containerRef} className={cn('relative isolate', className)}>
      {hasLeading ? (
        <motion.div
          aria-hidden
          style={{ opacity: leadingOpacity }}
          className={cn(
            'absolute inset-y-0 left-0 -z-10 flex w-full justify-start overflow-hidden rounded-card',
            TONE_SURFACE[leading[0]!.tone ?? 'neutral'],
          )}
        >
          {leading.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              hidden={armed === 'leading' && index !== 0}
              onFire={() => fireFromTray(action)}
            />
          ))}
        </motion.div>
      ) : null}

      {hasTrailing ? (
        <motion.div
          aria-hidden
          style={{ opacity: trailingOpacity }}
          className={cn(
            'absolute inset-y-0 right-0 -z-10 flex w-full justify-end overflow-hidden rounded-card',
            TONE_SURFACE[trailing[trailing.length - 1]!.tone ?? 'neutral'],
          )}
        >
          {trailing.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              hidden={armed === 'trailing' && index !== trailing.length - 1}
              onFire={() => fireFromTray(action)}
            />
          ))}
        </motion.div>
      ) : null}

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

function TrayButton({
  action,
  hidden,
  onFire,
}: {
  action: SwipeAction
  hidden: boolean
  onFire: () => void
}) {
  return (
    <motion.button
      type="button"
      tabIndex={-1}
      aria-label={action.label}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      onClick={onFire}
      style={{ width: ACTION_WIDTH }}
      className={cn(
        'flex h-full shrink-0 flex-col items-center justify-center gap-1 text-(length:--p-text-tiny) font-semibold transition-[filter] active:brightness-95',
        TONE_SURFACE[action.tone ?? 'neutral'],
      )}
    >
      {action.icon}
      {action.label}
    </motion.button>
  )
}
