import {
  type MouseEvent as ReactMouseEvent,
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
import { useDrag } from '@use-gesture/react'
import { ACTION_ACCENT, type ActionAccent } from '@/shared/config/actions'
import {
  armedSide,
  clampSwipeOffset,
  cn,
  dragFrame,
  impact,
  resolveSwipeRelease,
  type SwipeGeometry,
  useGestureHold,
} from '@/shared/lib'

export interface SwipeAction {
  id: string
  icon: ReactNode
  label: string
  accent?: ActionAccent
  onAction: () => void
}

export interface SwipeRowProps {
  children: ReactNode
  leading?: SwipeAction[]
  trailing?: SwipeAction[]
  disabled?: boolean
  className?: string
  bleed?: boolean
}

const ACTION_WIDTH = 60
const COMMIT_GAP = 64
const EDGE_INSET = 20

const SETTLE_SPRING = { type: 'spring', stiffness: 540, damping: 40 } as const

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
  /**
   * The trays exist from the first swipe on, not from mount. A list mounts a row per card and most
   * are never swiped; two trays of animated buttons under each was most of what a row cost to draw.
   * Once drawn they stay, so a row sliding shut never uncovers a tray that has already gone.
   */
  const [revealed, setRevealed] = useState(false)
  const wasArmed = useRef<Side | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const hasLeading = leading.length > 0
  const hasTrailing = trailing.length > 0
  const inset = bleed ? EDGE_INSET : 0
  const leadingWidth = hasLeading ? leading.length * ACTION_WIDTH + inset : 0
  const trailingWidth = hasTrailing ? trailing.length * ACTION_WIDTH + inset : 0
  const geo: SwipeGeometry = {
    hasLeading,
    hasTrailing,
    leadingWidth,
    trailingWidth,
    leadingCommit: leadingWidth + COMMIT_GAP,
    trailingCommit: trailingWidth + COMMIT_GAP,
  }

  const settle = useCallback(
    (to: number) => {
      if (reduce) x.set(to)
      else animate(x, to, SETTLE_SPRING)
    },
    [reduce, x],
  )

  const clearTray = useCallback(() => {
    setOpen(null)
    setArmed(null)
    wasArmed.current = null
  }, [])

  const { surface, hold, drop } = useGestureHold((reason) => {
    clearTray()
    if (reason === 'claimed') x.jump(0)
    else settle(0)
  })

  const close = useCallback(() => {
    clearTray()
    drop()
    settle(0)
  }, [clearTray, drop, settle])

  useEffect(() => {
    if (!disabled) return
    clearTray()
    drop()
    x.jump(0)
  }, [clearTray, disabled, drop, x])

  const suppressClick = useRef(false)

  const onPointerDownCapture = () => {
    suppressClick.current = false
  }

  useDrag(
    (state) => {
      const [ox] = state.offset
      if (state.first) hold()

      switch (dragFrame(state)) {
        case 'tap':
          return

        case 'canceled':
          wasArmed.current = null
          setArmed(null)
          close()
          return

        case 'released': {
          wasArmed.current = null
          setArmed(null)
          suppressClick.current = true
          const release = resolveSwipeRelease(x.get(), geo)
          switch (release.kind) {
            case 'commit-trailing':
              impact()
              trailing[trailing.length - 1]!.onAction()
              close()
              break
            case 'commit-leading':
              impact()
              leading[0]!.onAction()
              close()
              break
            case 'open-trailing':
              setOpen('trailing')
              settle(release.settleTo)
              break
            case 'open-leading':
              setOpen('leading')
              settle(release.settleTo)
              break
            case 'close':
              close()
              break
          }
          return
        }

        case 'moving': {
          if (!revealed) setRevealed(true)
          const next = clampSwipeOffset(ox, geo)
          x.set(next)
          const side = armedSide(next, geo)
          if (side !== wasArmed.current) {
            wasArmed.current = side
            setArmed(side)
            if (side) impact()
          }
        }
      }
    },
    {
      target: dragRef,
      axis: 'x',
      filterTaps: true,
      from: (): [number, number] => [x.get(), 0],
      enabled: !disabled,
    },
  )

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
      {...surface}
      onPointerDownCapture={onPointerDownCapture}
      className={cn(
        'relative isolate overflow-x-clip [overflow-clip-margin:24px]',
        bleed && '-mx-5',
        className,
      )}
    >
      {revealed && hasLeading ? (
        <Tray side="leading" x={x} bleed={bleed}>
          {leading.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              armed={armed === 'leading' && index === 0}
              onFire={() => fireFromTray(action)}
            />
          ))}
        </Tray>
      ) : null}

      {revealed && hasTrailing ? (
        <Tray side="trailing" x={x} bleed={bleed}>
          {trailing.map((action, index) => (
            <TrayButton
              key={action.id}
              action={action}
              armed={armed === 'trailing' && index === trailing.length - 1}
              onFire={() => fireFromTray(action)}
            />
          ))}
        </Tray>
      ) : null}

      <motion.div
        ref={dragRef}
        style={{ x, touchAction: 'pan-y' }}
        className={cn(bleed && 'px-5')}
        onClickCapture={onClickCapture}
      >
        {children}
      </motion.div>
    </div>
  )
}

/**
 * One side's buttons, under the row. Both trays are full-width, so at rest each lies over the whole
 * row — and a transparent element still takes the press. Whichever side the row is not open on
 * gives its pointers back, or the one on top (trailing, later in the DOM) swallows every tap meant
 * for the other's buttons.
 */
function Tray({
  side,
  x,
  bleed,
  children,
}: {
  side: Side
  x: MotionValue<number>
  bleed: boolean
  children: ReactNode
}) {
  const showing = (v: number) => (side === 'leading' ? v > 0 : v < 0)
  const opacity = useTransform(x, (v) => (showing(v) ? 1 : 0))
  const pointerEvents = useTransform(x, (v) => (showing(v) ? 'auto' : 'none'))
  return (
    <motion.div
      aria-hidden
      style={{ opacity, pointerEvents }}
      className={cn(
        'absolute inset-y-0 -z-10 flex w-full items-center',
        side === 'leading' ? 'left-0 justify-start' : 'right-0 justify-end',
        bleed && (side === 'leading' ? 'pl-5' : 'pr-5'),
      )}
    >
      {children}
    </motion.div>
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
  const accent = ACTION_ACCENT[action.accent ?? 'slate']
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={action.label}
      onClick={onFire}
      style={{ width: ACTION_WIDTH }}
      className="grid h-full shrink-0 place-items-center"
    >
      <span
        style={{ backgroundColor: accent.fill, color: accent.ink }}
        className={cn(
          'grid size-11 place-items-center rounded-full shadow-interactive [&_svg]:size-5',
          // The pop that says "let go and this fires": an overshooting ease, a CSS transition per
          // button rather than an animation node per button, and none under reduced motion.
          'transition-[scale,filter] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:brightness-95',
          'motion-reduce:transition-none',
          armed ? 'scale-[1.14]' : 'scale-100',
        )}
      >
        {action.icon}
      </span>
    </button>
  )
}
