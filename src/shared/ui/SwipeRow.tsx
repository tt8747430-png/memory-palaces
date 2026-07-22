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
import { type SwipeAccent, SWIPE_ACCENT } from '@/shared/config/swipe'
import {
  armedSide,
  clampSwipeOffset,
  cn,
  impact,
  resolveSwipeRelease,
  type SwipeGeometry,
} from '@/shared/lib'

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

  const suppressClick = useRef(false)

  // One recognizer for the whole row (the same `@use-gesture` `useDrag` the study/browser decks use).
  // Bound to the moving element via `target` (not a spread) so it composes with `motion.div`'s own
  // drag props; `touch-action: pan-y` lets vertical scrolls through natively, `filterTaps` keeps a tap
  // a tap.
  useDrag(
    (state) => {
      const [ox] = state.offset
      if (state.tap) return

      if (state.last) {
        suppressClick.current = true
        wasArmed.current = null
        setArmed(null)
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

      const next = clampSwipeOffset(ox, geo)
      x.set(next)
      const side = armedSide(next, geo)
      if (side !== wasArmed.current) {
        wasArmed.current = side
        setArmed(side)
        if (side) impact()
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
