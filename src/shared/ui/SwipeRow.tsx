import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
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
  /** Break out of the app's `px-5` column so the tray can sit against the row's
   *  resting edge. The reveal bleeds; the circular actions are padded back in by
   *  `EDGE_INSET` so they line up with where the row content was. */
  bleed?: boolean
}

const AXIS_LOCK = 8
/** Horizontal space each circular action reveals. */
const ACTION_WIDTH = 60
/** Extra swipe past the tray width before a release commits the edge action. */
const COMMIT_GAP = 64
/** Matches the app column's `px-5`, so the tray's outer circle lands where the
 *  row content sat before the swipe (only meaningful when `bleed`). */
const EDGE_INSET = 20

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
  const inset = bleed ? EDGE_INSET : 0
  const leadingWidth = hasLeading ? leading.length * ACTION_WIDTH + inset : 0
  const trailingWidth = hasTrailing ? trailing.length * ACTION_WIDTH + inset : 0
  const leadingCommit = leadingWidth + COMMIT_GAP
  const trailingCommit = trailingWidth + COMMIT_GAP

  const leadingOpacity = useTransform(x, (v) => (v > 0 ? 1 : 0))
  const trailingOpacity = useTransform(x, (v) => (v < 0 ? 1 : 0))

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
        'relative isolate overflow-x-clip [overflow-clip-margin:24px]',
        bleed && '-mx-5',
        className,
      )}
    >
      {hasLeading ? (
        <motion.div
          aria-hidden
          style={{ opacity: leadingOpacity }}
          className={cn(
            'absolute inset-y-0 left-0 -z-10 flex w-full items-center justify-start',
            bleed && 'pl-5',
          )}
        >
          {leading.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              armed={armed === 'leading' && index === 0}
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
            'absolute inset-y-0 right-0 -z-10 flex w-full items-center justify-end',
            bleed && 'pr-5',
          )}
        >
          {trailing.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              armed={armed === 'trailing' && index === trailing.length - 1}
              onFire={() => fireFromTray(action)}
            />
          ))}
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
  armed = false,
  onFire,
}: {
  action: SwipeAction
  armed?: boolean
  onFire: () => void
}) {
  const reduce = useReducedMotion()
  const accent = SWIPE_ACCENT[action.accent ?? 'slate']
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={action.label}
      onClick={onFire}
      style={{ width: ACTION_WIDTH }}
      className="grid h-full shrink-0 place-items-center"
    >
      {/* A small floating circle — the accent + glyph carry the meaning; the
          label lives on aria-label so the tray stays compact and calm. */}
      <motion.span
        animate={{ scale: armed ? 1.14 : 1 }}
        transition={reduce ? { duration: 0 } : ARM_SPRING}
        style={{ backgroundColor: accent.fill }}
        className={cn(
          'grid size-11 place-items-center rounded-full shadow-interactive [&_svg]:size-5',
          'transition-[filter] active:brightness-95',
          accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
        )}
      >
        {action.icon}
      </motion.span>
    </button>
  )
}
