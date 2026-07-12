import { motionValue } from 'motion/react'
import type { StickyHeader } from '@/shared/lib'

export function fakeStickyHeader(): StickyHeader {
  return {
    ref: () => {},
    elevation: motionValue(0),
  }
}
