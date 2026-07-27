import { createContext, use } from 'react'
import { type MotionValue, motionValue } from 'motion/react'

/** A screen that never scrolls keeps its header flat. */
const FLAT: MotionValue<number> = motionValue(0)

/**
 * How lifted the screen's header should look, 0–1, tracking how far its scroller has moved.
 *
 * `AppScreen` owns the scroll surface, so it measures this once and publishes it here; the header
 * it renders reads it through `useHeaderElevation()`. No page has to wire a ref between the two.
 */
export const HeaderElevationContext = createContext<MotionValue<number>>(FLAT)

export function useHeaderElevation(): MotionValue<number> {
  return use(HeaderElevationContext)
}
