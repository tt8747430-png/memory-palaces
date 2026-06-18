import { motionValue } from 'motion/react'
import type { CollapsibleHeader } from '@/shared/lib'

/** A static `CollapsibleHeader` for rendering headers in isolation — fixed at the
 * expanded (top-of-scroll) state, with a no-op ref. */
export function fakeCollapsibleHeader(): CollapsibleHeader {
  return {
    ref: () => {},
    heroOpacity: motionValue(1),
    heroScale: motionValue(1),
    heroY: motionValue(0),
    heroPointerEvents: motionValue<'auto' | 'none'>('auto'),
    compactOpacity: motionValue(0),
    compactPointerEvents: motionValue<'auto' | 'none'>('none'),
  }
}
