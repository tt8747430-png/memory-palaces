import { useCallback, useRef } from 'react'
import { useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { barElevation } from './elevation'

/** Scroll distance (px) over which the bar reaches full elevation (glass + edge). */
const DISTANCE = 16

export interface StickyHeader {
  /** Attach to the scroll container whose offset drives the elevation. */
  ref: (node: HTMLElement | null) => void
  /** 0 at the top (transparent, seamless) → 1 once scrolled (glass + hairline edge). */
  elevation: MotionValue<number>
}

/**
 * Drives the single persistent header bar. The shell is fixed-height and each screen
 * owns an inner scroll container, so this tracks that container's `scrollTop` (not the
 * window) via a **callback ref** — it re-attaches on every mount, and the window no
 * longer scrolls, so a window listener would never fire. There is no hero/compact
 * crossfade or parallax anymore: the bar keeps its size and only fades in a glass
 * background + hairline edge as content scrolls under it, so it stays accessible under
 * reduced motion without a separate alternative.
 */
export function useStickyHeader(distance: number = DISTANCE): StickyHeader {
  const scrollY = useMotionValue(0)
  const detach = useRef<(() => void) | null>(null)

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

  const elevation = useTransform(scrollY, (y) => barElevation(y, distance))

  return { ref, elevation }
}
