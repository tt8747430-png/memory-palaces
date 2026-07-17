import { useCallback, useRef } from 'react'
import { type MotionValue, useMotionValue, useTransform } from 'motion/react'
import { barElevation } from './elevation'

const DISTANCE = 16

export interface StickyHeader {
  ref: (node: HTMLElement | null) => void
  elevation: MotionValue<number>
}

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
