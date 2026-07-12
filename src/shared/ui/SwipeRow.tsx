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
import { type SwipeAccent, SWIPE_ACCENT } from '@/shared/config/swipe'
import { cn, impact } from '@/shared/lib'

export type { SwipeAccent }

export interface SwipeAction {
  id: string
  icon: ReactNode
  label: string
  accent?: SwipeAccent
  onAction: () => void
}

export interface SwipeRowProps {
  children: ReactNode
  leading?: SwipeAction[]
  trailing?: SwipeAction[]
  disabled?: boolean
  className?: string
  /** Break out of the app's `px-5` column so the action tray runs edge-to-edge.
   *  The resting row content is padded back in, so only the swipe reveal bleeds. */
  bleed?: boolean
}

const AXIS_LOCK = 8
const ACTION_WIDTH = 88
const COMMIT_GAP = 72

const SETTLE_SPRING = { type: 'spring', stiffness: 540, damping: 40 } as const
const ARM_SPRING = { type: 'spring', stiffness: 460, damping: 34 } as const

type Side = 'leading' | 'trailing'

export function SwipeRow({
  children,
  leading = [],
  trailing = [],
  disabled = false,
  className,
  bleed = false,
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

  const leadingEdgeFill = useTransform([x, leadingArm], ([v, arm]: number[]) => {
    const siblings = Math.max(0, leading.length - 1) * ACTION_WIDTH
    return Math.max(ACTION_WIDTH, Math.max(0, v!) - siblings * (1 - arm!))
  })
  const trailingEdgeFill = useTransform([x, trailingArm], ([v, arm]: number[]) => {
    const siblings = Math.max(0, trailing.length - 1) * ACTION_WIDTH
    return Math.max(ACTION_WIDTH, Math.max(0, -v!) - siblings * (1 - arm!))
  })

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

  useEffect(() => {
    if (disabled && (open || x.get() !== 0)) {
      setOpen(null)
      setArmed(null)
      wasArmed.current = null
      x.set(0)
    }
  }, [disabled, open, x])

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      const root = rootRef.current
      if (root && !root.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', closeOnOutside, true)
    return () => document.removeEventListener('pointerdown', closeOnOutside, true)
  }, [open, close])

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

    const offset = x.get()

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
        'relative isolate overflow-x-clip [overflow-clip-margin:16px]',
        bleed && '-mx-5',
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
        className={cn(bleed && 'px-5')}
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
  fillWidth,
  collapsed = false,
  onFire,
}: {
  action: SwipeAction
  fillWidth?: MotionValue<number>
  collapsed?: boolean
  onFire: () => void
}) {
  const reduce = useReducedMotion()
  const isEdge = fillWidth !== undefined
  const accent = SWIPE_ACCENT[action.accent ?? 'slate']
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
      {/* Icon-only: the accent + glyph carry the meaning; the label lives on
          aria-label, so the tray stays calm and uncluttered. */}
      <span
        className={cn(
          'grid size-full place-items-center rounded-[20px] px-2 [&_svg]:size-6',
          'transition-[filter] active:brightness-95',
          accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
        )}
        style={{ backgroundColor: accent.fill }}
      >
        {action.icon}
      </span>
    </motion.button>
  )
}
