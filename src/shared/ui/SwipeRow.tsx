import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
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

  const leadingOpacity = useTransform(x, (v) => (v > 0 ? 1 : 0))
  const trailingOpacity = useTransform(x, (v) => (v < 0 ? 1 : 0))

  const settle = useCallback(
    (to: number) => {
      if (reduce) x.set(to)
      else animate(x, to, SETTLE_SPRING)
    },
    [reduce, x],
  )

  /** Forget the tray — what is open, what is armed. Where the row sits is `settle`'s to say. */
  const clearTray = useCallback(() => {
    setOpen(null)
    setArmed(null)
    wasArmed.current = null
  }, [])

  /**
   * Put the row back and give the claim up in one act, so the registry never holds a row that has
   * already closed. A row asked to release by a touch that is taking it over jumps instead of
   * springing: the new surface is already moving, and a spring here is the second thing moving.
   */
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

  /**
   * The guard against the click a finished drag leaves behind belongs to that drag, so the next
   * touch clears it — left standing it is the row's next honest tap that gets swallowed. It has to
   * be a real `pointerdown` and not the drag engine's first frame: with a locked axis the engine
   * reports nothing at all until the finger has moved, which is exactly the tap that needs it gone.
   */
  const onPointerDownCapture = () => {
    suppressClick.current = false
  }

  useDrag(
    (state) => {
      const [ox] = state.offset
      // The row owns this touch from here: whatever was displaced before it goes back first.
      if (state.first) hold()

      switch (dragFrame(state)) {
        case 'tap':
          return

        // The platform took the touch away, which is not the learner releasing it: put the row
        // back and fire nothing.
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
            // The row stays displaced, so it stays the holder: the next touch anywhere is what
            // puts it back.
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
      /**
       * The clip is unconditional. It used to be a piece of state toggled from every frame of the
       * drag, which re-rendered the row — and its children — on each one, for a class whose margin
       * already leaves the resting row's shadow and ring untouched (CODE_STYLE §11).
       */
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
