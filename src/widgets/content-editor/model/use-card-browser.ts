import { type RefObject, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, useTransform } from 'motion/react'
import { useDrag } from '@use-gesture/react'
import type { Card } from '@/entities/card'
import { STACK_DEPTH, tick } from '@/shared/lib'
import { CARD_EASE, SPRING } from '../ui/browser-poses'

export type EnterFrom = 'behind' | 'edge' | null

export interface CardBrowserState {
  index: number
  current: Card | null
  ahead: Card[]
  flipped: boolean
  enterFrom: EnterFrom
  x: ReturnType<typeof useMotionValue<number>>
  rotate: ReturnType<typeof useTransform<number, number>>
  go: (delta: number) => void
  bind: ReturnType<typeof useDrag>
  offscreen: () => number
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
  const [enterFrom, setEnterFrom] = useState<EnterFrom>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-6, 0, 6])
  const count = cards.length
  const animating = useRef(false)

  useEffect(() => {
    if (!open) return
    const at = startId ? cards.findIndex((l) => l.id === startId) : 0
    setIndex(at < 0 ? 0 : at)
    setFlipped(false)
    setEnterFrom(null)
    animating.current = false
    x.set(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  useEffect(() => {
    if (!open) return
    if (count === 0) onClose()
    else if (index > count - 1) setIndex(count - 1)
  }, [open, count, index, onClose])

  const offscreen = () => (shellRef.current?.offsetWidth ?? 430) + 48

  const go = (delta: number) => {
    const next = index + delta
    if (animating.current || next < 0 || next > count - 1) {
      animate(x, 0, SPRING)
      return
    }
    tick()
    if (reduce) {
      setFlipped(false)
      setEnterFrom(null)
      setIndex(next)
      x.set(0)
      return
    }
    animating.current = true
    const dir = delta > 0 ? -1 : 1
    animate(x, dir * offscreen(), {
      duration: 0.2,
      ease: CARD_EASE,
      onComplete: () => {
        setFlipped(false)
        setEnterFrom(delta > 0 ? 'behind' : 'edge')
        setIndex(next)
        x.set(0)
        animating.current = false
      },
    })
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], tap }) => {
      if (animating.current) return
      if (tap) {
        setFlipped((value) => !value)
        return
      }
      if (down) {
        x.set(mx)
        return
      }
      const fling = vx > 0.45
      if ((mx < -70 || (fling && dx < 0)) && index < count - 1) go(1)
      else if ((mx > 70 || (fling && dx > 0)) && index > 0) go(-1)
      else animate(x, 0, SPRING)
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  )

  return {
    index,
    current: count > 0 ? cards[Math.min(index, count - 1)]! : null,
    ahead: cards.slice(index + 1, index + 1 + STACK_DEPTH),
    flipped,
    enterFrom,
    x,
    rotate,
    go,
    bind,
    offscreen,
  }
}
