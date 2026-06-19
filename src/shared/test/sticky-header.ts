import { motionValue } from 'motion/react'
import type { StickyHeader } from '@/shared/lib'

/** A static `StickyHeader` for rendering headers in isolation — pinned at the top
 * (elevation 0, the transparent/seamless rest state) with a no-op scroll ref. */
export function fakeStickyHeader(): StickyHeader {
  return {
    ref: () => {},
    elevation: motionValue(0),
  }
}
