import { useEffect, useRef, useState } from 'react'
import { animate, type MotionValue, useMotionValue, useTransform } from 'motion/react'
import { useDrag } from '@use-gesture/react'
import {
  type FlashcardSwipeAction,
  type FlashcardSwipeConfig,
  isGradeAction,
  isModeAction,
  type ModeSwipeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { impact, tick } from '@/shared/lib'

const LONG_PRESS_MS = 450
const LONG_PRESS_SLOP = 12
/** Far enough off screen that the card is gone before its successor settles. */
const FLING_DISTANCE = 620
const SNAP = { type: 'spring', stiffness: 520, damping: 34 } as const

export interface CardSwipe {
  x: MotionValue<number>
  y: MotionValue<number>
  rotate: MotionValue<number>
  /** Spread onto the card's motion wrapper. */
  bind: ReturnType<typeof useDrag>
}

interface Args {
  swipeConfig: FlashcardSwipeConfig
  reduce: boolean
  /** A tap anywhere that isn't a control. */
  onFlip: () => void
  onLongPress?: () => void
  /** A grade, skip or flag — anything the session, not the face, has to answer for. */
  onCommit: (direction: SwipeDirection) => void
  /** An action the visible face owns (reveal more, reset, next word). */
  onMechanic: (action: ModeSwipeAction) => void
}

function advances(action: FlashcardSwipeAction): boolean {
  return isGradeAction(action) || action === 'skip'
}

function controlOf(target: EventTarget | null): HTMLElement | null {
  return (
    (target as HTMLElement | null)?.closest<HTMLElement>(
      'button, input, textarea, a, select, [role="button"], [data-card-control]',
    ) ?? null
  )
}

const isControl = (target: EventTarget | null) => controlOf(target) !== null

/** True when the press landed in the card's scrolling body, which owns vertical movement. */
const isScroller = (target: EventTarget | null) =>
  Boolean((target as HTMLElement | null)?.closest('[data-card-scroll]'))

/** A control swallows the swipe unless it is the flip zone, which is the card's own surface. */
const swipeAllowed = (target: EventTarget | null) => {
  const control = controlOf(target)
  return control === null || control.hasAttribute('data-flip')
}

/**
 * The flashcard's gesture layer: drag to move the card, release past the threshold to commit the
 * direction's action, tap to flip, hold to open the quick actions. It owns the motion values the
 * card and its direction chips render from, and nothing about what any action means.
 */
export function useCardSwipe({
  swipeConfig,
  reduce,
  onFlip,
  onLongPress,
  onCommit,
  onMechanic,
}: Args): CardSwipe {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])

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

  const commit = async (dir: SwipeDirection) => {
    if (locked) return
    const action = swipeConfig[dir]
    if (action === 'none') {
      snapBack()
      return
    }
    if (isModeAction(action)) {
      onMechanic(action)
      tick()
      snapBack()
      return
    }
    if (!advances(action)) {
      onCommit(dir)
      tick()
      snapBack()
      return
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
    // Hand the card over and drop the slot back to centre in the same tick: the card that flew
    // away has already unmounted, and the one taking its place enters from the deck itself.
    onCommit(dir)
    x.jump(0)
    y.jump(0)
    setLocked(false)
  }

  const bind = useDrag(
    ({ first, down, movement: [mx, my], velocity: [vx, vy], tap, event }) => {
      if (locked) return
      if (first) {
        armedRef.current = swipeAllowed(event.target)
        // A press inside the scrolling body still swipes sideways, but its vertical movement
        // belongs to the browser — otherwise a long answer costs the learner every swipe.
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
      if (tap) {
        clearHold()
        if (heldRef.current) {
          heldRef.current = false
          return
        }
        if (!isControl(event.target)) onFlip()
        return
      }
      if (!armedRef.current) return

      const horizontalOnly = horizontalOnlyRef.current
      const ax = Math.abs(mx)
      const ay = Math.abs(my)
      if (ax > LONG_PRESS_SLOP || ay > LONG_PRESS_SLOP) clearHold()
      if (down) {
        x.set(mx)
        if (!horizontalOnly) y.set(my)
        return
      }
      clearHold()
      if (heldRef.current) {
        heldRef.current = false
        snapBack()
        return
      }
      const fling = (horizontalOnly ? vx : Math.max(vx, vy)) > 0.5
      if (ax < 80 && (horizontalOnly || ay < 80) && !fling) {
        snapBack()
        return
      }
      if (horizontalOnly && ax < ay) {
        snapBack()
        return
      }
      if (ax >= ay) void commit(mx > 0 ? 'right' : 'left')
      else if (my < 0) void commit('up')
      else void commit('down')
    },
    { filterTaps: true, pointer: { touch: true } },
  )

  return { x, y, rotate, bind }
}
