import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, type MotionValue, useMotionValue, useTransform } from 'motion/react'
import { useDrag } from '@use-gesture/react'
import {
  type FlashcardInput,
  type FlashcardSwipeConfig,
  isAdvancingAction,
  isModeAction,
  type ModeSwipeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import {
  dragFrame,
  type FlingThresholds,
  impact,
  resolveThrow,
  type SurfaceProps,
  tick,
  useGestureHold,
} from '@/shared/lib'
import { zoneFor } from './tap-zones'

const LONG_PRESS_MS = 450
const LONG_PRESS_SLOP = 12
const FLING_DISTANCE = 620
const SNAP = { type: 'spring', stiffness: 520, damping: 34 } as const

const THROW: FlingThresholds = { distance: 80, speed: 0.5 }

export interface CardSwipe {
  x: MotionValue<number>
  y: MotionValue<number>
  rotate: MotionValue<number>
  bind: ReturnType<typeof useDrag>
  surface: SurfaceProps
}

interface Args {
  swipeConfig: FlashcardSwipeConfig
  /** Whether an answer is thrown or tapped. It changes how an action is given, never which ones. */
  input: FlashcardInput
  reduce: boolean
  onFlip: () => void
  onLongPress?: () => void
  onCommit: (direction: SwipeDirection) => void
  onMechanic: (action: ModeSwipeAction) => void
}

function controlOf(target: EventTarget | null): HTMLElement | null {
  return (
    (target as HTMLElement | null)?.closest<HTMLElement>(
      'button, input, textarea, a, select, [role="button"], [data-card-control]',
    ) ?? null
  )
}

const isControl = (target: EventTarget | null) => controlOf(target) !== null

const isScroller = (target: EventTarget | null) =>
  Boolean((target as HTMLElement | null)?.closest('[data-card-scroll]'))

const swipeAllowed = (target: EventTarget | null) => {
  const control = controlOf(target)
  return control === null || control.hasAttribute('data-flip')
}

export function useCardSwipe({
  swipeConfig,
  input,
  reduce,
  onFlip,
  onLongPress,
  onCommit,
  onMechanic,
}: Args): CardSwipe {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])
  const card = useRef<HTMLElement | null>(null)

  const [locked, setLocked] = useState(false)
  const armedRef = useRef(true)
  const horizontalOnlyRef = useRef(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const heldRef = useRef(false)

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = undefined
    }
  }
  useEffect(() => () => clearHold(), [])

  const snapBack = () => {
    animate(x, 0, SNAP)
    animate(y, 0, SNAP)
  }

  const {
    surface: holdSurface,
    hold,
    drop,
  } = useGestureHold(() => {
    if (locked) return
    clearHold()
    heldRef.current = false
    snapBack()
  })

  /**
   * The gesture surface, told to keep hold of the node as well. A tap is resolved against the
   * card's own box, so the zones follow it wherever it is laid out — and one ref on one element
   * beats two that could disagree.
   */
  const surface = useMemo<SurfaceProps>(
    () => ({
      ...holdSurface,
      ref: (node: HTMLElement | null) => {
        holdSurface.ref(node)
        card.current = node
      },
    }),
    [holdSurface],
  )

  const commit = async (dir: SwipeDirection) => {
    if (locked) return drop()
    const action = swipeConfig[dir]
    if (action === 'none') {
      snapBack()
      return drop()
    }
    if (isModeAction(action)) {
      onMechanic(action)
      tick()
      snapBack()
      return drop()
    }
    if (!isAdvancingAction(action)) {
      onCommit(dir)
      tick()
      snapBack()
      return drop()
    }
    setLocked(true)
    impact()
    const tx = dir === 'right' ? FLING_DISTANCE : dir === 'left' ? -FLING_DISTANCE : 0
    const ty = dir === 'down' ? FLING_DISTANCE : dir === 'up' ? -FLING_DISTANCE : 0
    const duration = reduce ? 0 : 0.24
    await Promise.all([
      tx ? animate(x, tx, { duration, ease: [0.4, 0, 1, 1] }).finished : Promise.resolve(),
      ty ? animate(y, ty, { duration, ease: [0.4, 0, 1, 1] }).finished : Promise.resolve(),
    ])
    onCommit(dir)
    x.jump(0)
    y.jump(0)
    setLocked(false)
    drop()
  }

  const bind = useDrag(
    ({
      first,
      last,
      down,
      movement: [mx, my],
      velocity: [vx, vy],
      direction: [dx, dy],
      xy,
      tap,
      event,
    }) => {
      if (locked) return
      if (first) {
        hold()
        armedRef.current = swipeAllowed(event.target)
        horizontalOnlyRef.current = isScroller(event.target)
        heldRef.current = false
        clearHold()
        if (armedRef.current) {
          holdTimer.current = window.setTimeout(() => {
            heldRef.current = true
            impact()
            onLongPress?.()
          }, LONG_PRESS_MS)
        }
      }
      const frame = dragFrame({ tap, last, event })

      if (frame === 'tap') {
        clearHold()
        drop()
        if (heldRef.current) {
          heldRef.current = false
          return
        }
        // A control under the finger always wins: that is what keeps the zones safe in every
        // display mode, because every mode's own work — a blurred word, a token, the type field,
        // an aid button — is a control.
        if (isControl(event.target)) return
        if (input === 'swipe') {
          onFlip()
          return
        }
        const box = card.current?.getBoundingClientRect()
        const zone = box
          ? zoneFor(
              { x: xy[0], y: xy[1] },
              { left: box.left, top: box.top, width: box.width, height: box.height },
            )
          : 'centre'
        if (zone === 'centre') onFlip()
        else void commit(zone)
        return
      }
      if (!armedRef.current) {
        if (frame !== 'moving') drop()
        return
      }
      if (input === 'tap') {
        // Nothing is thrown in this mode, so the card never follows the finger. The hold still
        // stands, which is why the slop check survives.
        if (Math.abs(mx) > LONG_PRESS_SLOP || Math.abs(my) > LONG_PRESS_SLOP) clearHold()
        if (frame !== 'moving') {
          clearHold()
          heldRef.current = false
          drop()
        }
        return
      }

      const horizontalOnly = horizontalOnlyRef.current
      if (Math.abs(mx) > LONG_PRESS_SLOP || Math.abs(my) > LONG_PRESS_SLOP) clearHold()
      if (frame === 'moving') {
        if (!down) return
        x.set(mx)
        if (!horizontalOnly) y.set(my)
        return
      }
      clearHold()
      if (heldRef.current || frame === 'canceled') {
        heldRef.current = false
        snapBack()
        drop()
        return
      }
      const thrown = resolveThrow(
        {
          movement: [mx, my],
          velocity: [vx, vy],
          direction: [dx, dy],
          ...(horizontalOnly ? { lockedTo: 'x' as const } : {}),
        },
        THROW,
      )
      if (!thrown) {
        snapBack()
        drop()
        return
      }
      void commit(
        thrown.axis === 'x'
          ? thrown.sign > 0
            ? 'right'
            : 'left'
          : thrown.sign > 0
            ? 'down'
            : 'up',
      )
    },
    { filterTaps: true, pointer: { touch: true } },
  )

  return { x, y, rotate, bind, surface }
}
