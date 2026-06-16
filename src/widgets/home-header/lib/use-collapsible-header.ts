import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { compactOpacity, heroOpacity, heroScale, heroY } from './collapse'

/** Distance (px) over which the hero fully recedes and the compact bar takes over. */
const DISTANCE = 120

export interface CollapsibleHeader {
  heroOpacity: MotionValue<number>
  heroScale: MotionValue<number>
  heroY: MotionValue<number>
  heroPointerEvents: MotionValue<'auto' | 'none'>
  compactOpacity: MotionValue<number>
  compactPointerEvents: MotionValue<'auto' | 'none'>
}

/**
 * Scroll-driven header collapse. The new app scrolls the window, so this tracks the
 * viewport (`useScroll()`) — no inner scroll container needed. The pure maps in
 * `collapse.ts` do the interpolation; reduced motion keeps the opacity crossfade but
 * drops the scale/translate parallax. Pointer-events flip so the hidden layer never
 * swallows taps.
 */
export function useCollapsibleHeader(distance: number = DISTANCE): CollapsibleHeader {
  const { scrollY } = useScroll()
  const reduce = useReducedMotion() ?? false

  const opacity = useTransform(scrollY, (y) => heroOpacity(y, distance))
  const scale = useTransform(scrollY, (y) => heroScale(y, distance, reduce))
  const y = useTransform(scrollY, (value) => heroY(value, distance, reduce))
  const heroPointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'))

  const compact = useTransform(scrollY, (value) => compactOpacity(value, distance))
  const compactPointerEvents = useTransform(compact, (v) => (v > 0.5 ? 'auto' : 'none'))

  return {
    heroOpacity: opacity,
    heroScale: scale,
    heroY: y,
    heroPointerEvents,
    compactOpacity: compact,
    compactPointerEvents,
  }
}
