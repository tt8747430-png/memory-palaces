import { useCallback, useRef } from 'react'
import { useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { compactOpacity, heroOpacity, heroScale, heroY } from './collapse'

/** Distance (px) over which the hero fully recedes and the compact bar takes over. */
const DISTANCE = 120

export interface CollapsibleHeader {
  /** Attach to the scroll container whose offset drives the collapse. */
  ref: (node: HTMLElement | null) => void
  heroOpacity: MotionValue<number>
  heroScale: MotionValue<number>
  heroY: MotionValue<number>
  heroPointerEvents: MotionValue<'auto' | 'none'>
  compactOpacity: MotionValue<number>
  compactPointerEvents: MotionValue<'auto' | 'none'>
}

/**
 * Scroll-driven header collapse. The shell is fixed-height and each screen owns an
 * inner scroll container, so this tracks that container's `scrollTop` (not the window)
 * via a **callback ref** — it re-attaches on every mount, and the window no longer
 * scrolls, so a window listener would never fire. The pure maps in `collapse.ts` do
 * the interpolation; reduced motion keeps the opacity crossfade but drops the
 * scale/translate parallax. Pointer-events flip so the hidden layer never swallows taps.
 */
export function useCollapsibleHeader(distance: number = DISTANCE): CollapsibleHeader {
  const scrollY = useMotionValue(0)
  const detach = useRef<(() => void) | null>(null)
  const reduce = useReducedMotion() ?? false

  const ref = useCallback(
    (node: HTMLElement | null) => {
      detach.current?.()
      detach.current = null
      if (!node) return
      const onScroll = () => scrollY.set(node.scrollTop)
      onScroll()
      node.addEventListener('scroll', onScroll, { passive: true })
      detach.current = () => node.removeEventListener('scroll', onScroll)
    },
    [scrollY],
  )

  const opacity = useTransform(scrollY, (y) => heroOpacity(y, distance))
  const scale = useTransform(scrollY, (y) => heroScale(y, distance, reduce))
  const y = useTransform(scrollY, (value) => heroY(value, distance, reduce))
  const heroPointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'))

  const compact = useTransform(scrollY, (value) => compactOpacity(value, distance))
  const compactPointerEvents = useTransform(compact, (v) => (v > 0.5 ? 'auto' : 'none'))

  return {
    ref,
    heroOpacity: opacity,
    heroScale: scale,
    heroY: y,
    heroPointerEvents,
    compactOpacity: compact,
    compactPointerEvents,
  }
}
