import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { SwipeTone } from '@/shared/config/swipe'
import { cn, impact } from '@/shared/lib'

export type { SwipeTone }

/** The filled action button per tone (iOS-Mail register): a saturated rounded rectangle
 * carrying the glyph + label stacked inside it. Amber needs ink text (white fails on it);
 * the on-brand neutral carries navy. */
const TONE_FILL: Record<SwipeTone, string> = {
  danger: 'bg-[var(--danger)] text-white',
  warning: 'bg-[var(--warning)] text-[var(--p-navy-900)]',
  success: 'bg-[var(--success)] text-white',
  accent: 'bg-[var(--accent)] text-white',
  neutral: 'bg-secondary text-primary',
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
/** Width (px) of each resting tray button (slot). The coloured pill sits inside with a margin,
 * so this doubles as the reveal width per action. */
const ACTION_WIDTH = 88
/** Pull (px) PAST the open tray that arms the edge-most action's auto-fire. Anchored to the
 * tray width (not the row width) so left and right fire with the same extra pull, however many
 * actions a side holds. */
const COMMIT_GAP = 72

/** Closing / resting spring — quick and well-damped so the row never wobbles. */
const SETTLE_SPRING = { type: 'spring', stiffness: 540, damping: 40 } as const
/** The arm (expand / collapse) spring — a touch looser so the fill reads as a deliberate swell. */
const ARM_SPRING = { type: 'spring', stiffness: 460, damping: 34 } as const

type Side = 'leading' | 'trailing'

/**
 * Wraps a list row with the iOS-Mail swipe pattern. A short swipe rests the row open over a
 * tray of filled action buttons (the user taps one); a longer swipe past the tray arms the
 * edge-most action of that side, expanding it to fill the tray, and releasing auto-fires it.
 *
 * Built on plain pointer events so a tap is never swallowed. The **live x offset is the single
 * source of truth**: the drag starts from wherever the row currently sits, tracks the finger
 * 1:1 into `x`, and both the visuals and the release decision read from `x` — never a re-read
 * pointer coordinate — so what you see is always what commits. Tracking locks to the horizontal
 * axis only once horizontal movement wins; a vertical drag falls through to native scroll
 * (`touch-action: pan-y`). The trays are `aria-hidden`; the row keeps its own menu as the
 * keyboard/assistive path.
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
  const [open, setOpen] = useState<Side | null>(null)
  const [armed, setArmed] = useState<Side | null>(null)
  const wasArmed = useRef<Side | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const hasLeading = leading.length > 0
  const hasTrailing = trailing.length > 0
  const leadingWidth = leading.length * ACTION_WIDTH
  const trailingWidth = trailing.length * ACTION_WIDTH
  const leadingCommit = leadingWidth + COMMIT_GAP
  const trailingCommit = trailingWidth + COMMIT_GAP

  const leadingOpacity = useTransform(x, (v) => (v > 0 ? 1 : 0))
  const trailingOpacity = useTransform(x, (v) => (v < 0 ? 1 : 0))

  // Arm progress per side (0 → the secondary actions are still parked on the card side; 1 → they
  // have collapsed and the edge action owns the whole tray). Springs on the commit so the edge
  // swells smoothly into the freed space, in step with the secondaries folding away.
  const leadingArm = useMotionValue(0)
  const trailingArm = useMotionValue(0)
  useEffect(() => {
    const target = armed === 'leading' ? 1 : 0
    if (reduce) {
      leadingArm.set(target)
      return
    }
    const controls = animate(leadingArm, target, ARM_SPRING)
    return () => controls.stop()
  }, [armed, reduce, leadingArm])
  useEffect(() => {
    const target = armed === 'trailing' ? 1 : 0
    if (reduce) {
      trailingArm.set(target)
      return
    }
    const controls = animate(trailingArm, target, ARM_SPRING)
    return () => controls.stop()
  }, [armed, reduce, trailingArm])

  // The edge action stays flush with the card: it fills the revealed strip minus whatever width
  // the (not-yet-collapsed) secondary actions still occupy on the card side. So it begins
  // stretching the instant a gap would open past the resting tray — not only at the commit point.
  const leadingEdgeFill = useTransform([x, leadingArm], ([v, arm]: number[]) => {
    const siblings = Math.max(0, leading.length - 1) * ACTION_WIDTH
    return Math.max(ACTION_WIDTH, Math.max(0, v!) - siblings * (1 - arm!))
  })
  const trailingEdgeFill = useTransform([x, trailingArm], ([v, arm]: number[]) => {
    const siblings = Math.max(0, trailing.length - 1) * ACTION_WIDTH
    return Math.max(ACTION_WIDTH, Math.max(0, -v!) - siblings * (1 - arm!))
  })

  // The gesture's start point plus the row's offset at press — so tracking continues from
  // wherever the row already rests, without a separate `base`/open bookkeeping that can desync.
  const drag = useRef<{
    startX: number
    startY: number
    startOffset: number
    axis: 'h' | 'v' | null
    id: number
  } | null>(null)

  const settle = useCallback(
    (to: number) => {
      if (reduce) x.set(to)
      else animate(x, to, SETTLE_SPRING)
    },
    [reduce, x],
  )

  const close = useCallback(() => {
    setOpen(null)
    setArmed(null)
    wasArmed.current = null
    settle(0)
  }, [settle])

  // A disabled row (drag in flight, select mode) can't be left resting open.
  useEffect(() => {
    if (disabled && (open || x.get() !== 0)) {
      setOpen(null)
      setArmed(null)
      wasArmed.current = null
      x.set(0)
    }
  }, [disabled, open, x])

  // A row left resting open snaps shut the moment the user touches anything outside it — a tap
  // elsewhere, another row, the toolbar — so an opened tray never lingers behind unrelated
  // interaction. Only armed while actually open, and it never blocks the outside gesture (no
  // preventDefault): it just closes in the capture phase.
  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      const root = rootRef.current
      if (root && !root.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', closeOnOutside, true)
    return () => document.removeEventListener('pointerdown', closeOnOutside, true)
  }, [open, close])

  // 1:1 reveal out to the commit point (tray + a short over-pull), then a soft rubber-band so
  // a hard fling can't run the row off-screen. Pulling the wrong way (no actions that side)
  // barely gives, signalling "nothing here".
  const clampOffset = (raw: number) => {
    if (raw > 0) {
      if (!hasLeading) return raw * 0.12
      if (raw <= leadingCommit) return raw
      return leadingCommit + (raw - leadingCommit) * 0.35
    }
    if (raw < 0) {
      if (!hasTrailing) return raw * 0.12
      if (raw >= -trailingCommit) return raw
      return -(trailingCommit + (-raw - trailingCommit) * 0.35)
    }
    return 0
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: x.get(),
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
      // Lock horizontal as soon as it wins; a clearly-vertical intent is a scroll and falls
      // through. A tie waits for more travel instead of discarding the gesture — that "drop on
      // the first ambiguous sample" is what made a slow, slightly-diagonal swipe unreliable.
      if (Math.abs(dx) > Math.abs(dy)) {
        state.axis = 'h'
        event.currentTarget.setPointerCapture?.(state.id)
      } else if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null
        return
      } else {
        return
      }
    }
    const next = clampOffset(state.startOffset + dx)
    x.set(next)

    const nextArmed: Side | null =
      next <= -trailingCommit && hasTrailing
        ? 'trailing'
        : next >= leadingCommit && hasLeading
          ? 'leading'
          : null
    if (nextArmed !== wasArmed.current) {
      wasArmed.current = nextArmed
      setArmed(nextArmed)
      if (nextArmed) impact()
    }
  }

  const finish = () => {
    const state = drag.current
    drag.current = null
    if (!state || state.axis !== 'h') return
    suppressClick.current = true
    wasArmed.current = null
    setArmed(null)

    // Decide from the offset the user actually SEES (the tracked motion value), never a re-read
    // pointer coordinate — that re-derivation was the source of the wrong-side commits.
    const offset = x.get()

    // Full swipe: auto-fire the edge-most action, then return to rest. A destructive action
    // unmounts the row before the spring shows; a reversible one springs back.
    if (offset <= -trailingCommit && hasTrailing) {
      impact()
      trailing[trailing.length - 1]!.onAction()
      close()
      return
    }
    if (offset >= leadingCommit && hasLeading) {
      impact()
      leading[0]!.onAction()
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
    <div
      ref={rootRef}
      className={cn(
        // Clip the row horizontally so a card dragged past its edge can't widen the scroll
        // container (which made the whole page pannable and let a slow swipe get hijacked by
        // the native pan). A clip-margin keeps the resting card's soft side shadow intact.
        'relative isolate overflow-x-clip [overflow-clip-margin:16px]',
        className,
      )}
    >
      {hasLeading ? (
        <motion.div
          aria-hidden
          style={{ opacity: leadingOpacity }}
          className="absolute inset-y-0 left-0 -z-10 flex w-full justify-start overflow-hidden"
        >
          {leading.map((action, index) =>
            index === 0 ? (
              <TrayButton
                key={action.id}
                action={action}
                fillWidth={leadingEdgeFill}
                onFire={() => fireFromTray(action)}
              />
            ) : (
              <TrayButton
                key={action.id}
                action={action}
                collapsed={armed === 'leading'}
                onFire={() => fireFromTray(action)}
              />
            ),
          )}
        </motion.div>
      ) : null}

      {hasTrailing ? (
        <motion.div
          aria-hidden
          style={{ opacity: trailingOpacity }}
          className="absolute inset-y-0 right-0 -z-10 flex w-full justify-end overflow-hidden"
        >
          {trailing.map((action, index) =>
            index === trailing.length - 1 ? (
              <TrayButton
                key={action.id}
                action={action}
                fillWidth={trailingEdgeFill}
                onFire={() => fireFromTray(action)}
              />
            ) : (
              <TrayButton
                key={action.id}
                action={action}
                collapsed={armed === 'trailing'}
                onFire={() => fireFromTray(action)}
              />
            ),
          )}
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

/**
 * One tray action, iOS-Mail style: a saturated rounded-rectangle button with the glyph and its
 * label stacked and centred inside it, inset from the card so the fills read as floating pills.
 *
 * The EDGE action (the one a full swipe fires) is given a live `fillWidth`: it tracks the reveal
 * and stays flush against the card the instant a gap would open past the resting tray, right
 * through the commit — capped at the tray via `max-w-full`. A SECONDARY action instead takes
 * `collapsed`, folding away behind the card once the edge action arms.
 */
function TrayButton({
  action,
  fillWidth,
  collapsed = false,
  onFire,
}: {
  action: SwipeAction
  /** Given to the edge action only: its live flush-fill width (rest → stretch → armed-full). */
  fillWidth?: MotionValue<number>
  /** Secondary actions collapse behind the card once the edge action arms. */
  collapsed?: boolean
  onFire: () => void
}) {
  const reduce = useReducedMotion()
  const isEdge = fillWidth !== undefined
  return (
    <motion.button
      type="button"
      tabIndex={-1}
      aria-label={action.label}
      onClick={onFire}
      style={isEdge ? { width: fillWidth } : undefined}
      animate={
        isEdge
          ? { opacity: 1 }
          : { width: collapsed ? 0 : ACTION_WIDTH, opacity: collapsed ? 0 : 1 }
      }
      transition={reduce ? { duration: 0 } : ARM_SPRING}
      className="h-full max-w-full shrink-0 overflow-hidden p-1"
    >
      <span
        className={cn(
          'flex size-full flex-col items-center justify-center gap-1 rounded-[20px] px-2',
          'transition-[filter] active:brightness-95',
          TONE_FILL[action.tone ?? 'neutral'],
        )}
      >
        <span className="grid shrink-0 place-items-center">{action.icon}</span>
        <span className="whitespace-nowrap text-(length:--p-text-tiny) font-semibold leading-none">
          {action.label}
        </span>
      </span>
    </motion.button>
  )
}
