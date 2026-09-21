import { type RefObject, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, useTransform } from 'motion/react'
import { useDrag } from '@use-gesture/react'
import type { Card } from '@/entities/card'
import {
  dragFrame,
  type FlingThresholds,
  resolveFling,
  STACK_DEPTH,
  type SurfaceProps,
  tick,
  useGestureHold,
} from '@/shared/lib'
import { CARD_EASE, SPRING } from '../ui/browser-poses'

const TURN: FlingThresholds = { distance: 70, speed: 0.45 }

export interface CardBrowserState {
  index: number
  current: Card | null
  /**
   * The two stacks behind the current card, nearest first. Both are rendered, and the view
   * cross-fades between them from the card's own position — so whichever way the card goes, it
   * uncovers the card that will take over, and nothing re-renders mid-drag (CODE_STYLE §12).
   */
  behindNext: Card[]
  behindPrev: Card[]
  flipped: boolean
  /** The current card was just promoted from the stack and should rise from there. */
  entering: boolean
  x: ReturnType<typeof useMotionValue<number>>
  rotate: ReturnType<typeof useTransform<number, number>>
  go: (delta: number) => void
  bind: ReturnType<typeof useDrag>
  surface: SurfaceProps
}

interface Args {
  open: boolean
  cards: Card[]
  startId: string | null
  reduce: boolean
  shellRef: RefObject<HTMLDivElement | null>
  onClose: () => void
}

export function useCardBrowser({
  open,
  cards,
  startId,
  reduce,
  shellRef,
  onClose,
}: Args): CardBrowserState {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [entering, setEntering] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-6, 0, 6])
  const count = cards.length
  const animating = useRef(false)

  useEffect(() => {
    if (!open) return
    const at = startId ? cards.findIndex((l) => l.id === startId) : 0
    setIndex(at < 0 ? 0 : at)
    setFlipped(false)
    setEntering(false)
    animating.current = false
    x.set(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  useEffect(() => {
    if (!open) return
    if (count === 0) onClose()
    else if (index > count - 1) setIndex(count - 1)
  }, [open, count, index, onClose])

  const { surface, hold, drop } = useGestureHold(() => {
    if (!animating.current) animate(x, 0, SPRING)
  })

  const offscreen = () => (shellRef.current?.offsetWidth ?? 430) + 48

  const go = (delta: number) => {
    const next = index + delta
    if (animating.current || next < 0 || next > count - 1) {
      animate(x, 0, SPRING)
      drop()
      return
    }
    tick()
    if (reduce) {
      setFlipped(false)
      setEntering(true)
      setIndex(next)
      x.set(0)
      drop()
      return
    }
    animating.current = true
    // The card leaves the way it was going and uncovers the stack on that side.
    const dir = delta > 0 ? -1 : 1
    animate(x, dir * offscreen(), {
      duration: 0.2,
      ease: CARD_EASE,
      onComplete: () => {
        setFlipped(false)
        setEntering(true)
        setIndex(next)
        x.set(0)
        animating.current = false
        drop()
      },
    })
  }

  const bind = useDrag(
    ({ first, last, down, movement: [mx], velocity: [vx], direction: [dx], tap, event }) => {
      if (animating.current) return
      if (first) hold()

      switch (dragFrame({ tap, last, event })) {
        case 'tap':
          drop()
          setFlipped((value) => !value)
          return

        case 'canceled':
          animate(x, 0, SPRING)
          drop()
          return

        case 'released': {
          const turn = resolveFling(mx, vx, dx, TURN)
          if (turn < 0 && index < count - 1) go(1)
          else if (turn > 0 && index > 0) go(-1)
          else {
            animate(x, 0, SPRING)
            drop()
          }
          return
        }

        case 'moving':
          if (down) x.set(mx)
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  )

  const at = Math.min(index, count - 1)

  return {
    index,
    current: count > 0 ? cards[at]! : null,
    behindNext: cards.slice(at + 1, at + 1 + STACK_DEPTH),
    behindPrev: cards.slice(Math.max(0, at - STACK_DEPTH), at).reverse(),
    flipped,
    entering,
    x,
    rotate,
    go,
    bind,
    surface,
  }
}
